/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path';
import { SfdxCommand } from '@salesforce/command';
import { fs, Messages, SfdxError } from '@salesforce/core';
import chalk from 'chalk';
import { AnyJson } from '@salesforce/ts-types';
import { devHubFlags } from '../../../lib/flags/commerce/devhub.flags';
import { filterFlags } from '../../../lib/utils/args/flagsUtils';
import { ConnectAppResult, DevHubConfig, Org, parseJSONConfigWithFlags } from '../../../lib/utils/jsonUtils';
import { Requires } from '../../../lib/utils/requires';
import { shell, shellJsonSfdx } from '../../../lib/utils/shell';
import { BASE_DIR, DEVHUB_DIR } from '../../../lib/utils/constants/properties';
import { mkdirSync } from '../../../lib/utils/fsUtils';
import { Devhub, statusManager } from '../../../lib/utils/statusFileManager';

const TOPIC = 'devhub';
const CMD = `commerce:${TOPIC}:auth`;
const msgs = Messages.loadMessages('commerce', TOPIC);

export class DevhubAuth extends SfdxCommand {
  public static description = msgs.getMessage('auth.cmdDescription');

  public static examples = [`sfdx ${CMD} --configuration devhub-configuration.json`];
  protected static flagsConfig = {
    ...filterFlags(['configuration', 'server-cert', 'use-jwt', 'client-id'], devHubFlags),
  };

  private devHubConfig: DevHubConfig;

  public async run(): Promise<AnyJson> {
    this.devHubConfig = await parseJSONConfigWithFlags(this.flags.configuration, DevhubAuth.flagsConfig, this.flags);
    await Requires.default(this.devHubConfig.instanceUrl).build();
    if (this.devHubConfig.useJwt) {
      await this.createConnectedApp();
      await this.authJwtGrant();
    } else await this.authWebLogin(this.devHubConfig.hubOrgAlias, this.devHubConfig.instanceUrl);
    return { authSuccessful: true };
  }

  public authWebLogin(hubOrgAlias: string, instanceUrl: string): Promise<void> {
    // TODO this can take clientId and needs a secret
    if (this.isDevhubConnected()) return;
    this.ux.log(chalk.green.bold(msgs.getMessage('auth.checkSync', [`${instanceUrl}`, `${hubOrgAlias}`])));
    this.ux.startSpinner(msgs.getMessage('auth.authenticating'));
    this.ux.setSpinnerStatus(msgs.getMessage('auth.authingWith', ['sfdx alt:auth:pass']));
    // TODO consider sfdx-waw-plugin here waw:auth:username:login
    let output = shellJsonSfdx(
      `sfdx auth:web:login -d -a "${hubOrgAlias}" -r "${instanceUrl}" ${
        this.devHubConfig.clientId ? '-i ' + this.devHubConfig.clientId : ''
      }` + (this.devHubConfig.sfdcLoginUrl ? ` --instanceurl "${this.devHubConfig.sfdcLoginUrl}"` : '')
    );
    this.ux.stopSpinner('Done Authenticating.');
    if (output.status === 0 && (!output.result || Object.keys(output.result).length === 0)) {
      this.ux.log('\n\n');
      output = shellJsonSfdx(
        `sfdx auth:web:login -d -a "${hubOrgAlias}" -r "${instanceUrl}"` +
          (this.devHubConfig.sfdcLoginUrl ? ` --instanceurl "${this.devHubConfig.sfdcLoginUrl}"` : '')
      );
      this.ux.log('\n\n');
      throw new SfdxError('Something went wrong');
    }
    this.ux.setSpinnerStatus(msgs.getMessage('auth.addingClientIdToHubAuthFile'));
    if (!this.isDevhubConnected())
      // this should check connceted status and save auth file
      throw new SfdxError('Devhub not connected');
    this.ux.stopSpinner(msgs.getMessage('auth.doneAuthenticating'));
    this.ux.log(chalk.green(msgs.getMessage('auth.successfullyAuthenticated')));
  }

  public async authJwtGrant(): Promise<void> {
    if (this.isDevhubConnected()) return;
    const connectApp = Object.assign(
      new ConnectAppResult(),
      await statusManager.getValue(this.devHubConfig, new Devhub(), 'connectApp')
    );
    shellJsonSfdx(
      `sfdx force:auth:jwt:grant -i "${connectApp.oauthConfig.consumerKey}"` +
        ` -u ${this.devHubConfig.hubOrgAdminUsername} -f ${BASE_DIR + '/.certs'}/server.key` +
        ` -r ${this.devHubConfig.instanceUrl}`
    );
    if (!this.isDevhubConnected())
      // this should check connceted status and save auth file
      throw new SfdxError('Devhub not connected');
    this.ux.stopSpinner(msgs.getMessage('auth.doneAuthenticating'));
    this.ux.log(chalk.green(msgs.getMessage('auth.successfullyAuthenticated')));
  }

  public isDevhubConnected(): boolean {
    const devdir = DEVHUB_DIR(BASE_DIR, this.devHubConfig.hubOrgAdminUsername);
    const authFile = mkdirSync(devdir) + '/authFile.json';
    try {
      const orgInfo = shellJsonSfdx<Org>(
        `sfdx force:org:display -u ${this.devHubConfig.hubOrgAdminUsername} --verbose --json`
      );
      if (orgInfo.result.connectedStatus !== 'Connected') {
        shellJsonSfdx(`sfdx force:auth:logout -u ${this.devHubConfig.hubOrgAdminUsername} -p`);
        return this.isDevhubConnected();
      }
      this.ux.log(msgs.getMessage('auth.already'));
      fs.writeFileSync(authFile, JSON.stringify(orgInfo));
    } catch (e) {
      if (!fs.existsSync(authFile)) return false;
      try {
        shellJsonSfdx(`sfdx force:auth:sfdxurl:store -f ${authFile} -a ${this.devHubConfig.hubOrgAlias}`);
      } catch (ee) {
        return false;
      }
    }
    return true;
  }

  /**
   * Run through either jwt or key based authentication
   * If no server key is passed then create one
   */
  public async createConnectedApp(): Promise<void> {
    const connectedApp = Object.assign(
      new ConnectAppResult(),
      await statusManager.getValue(this.devHubConfig, new Devhub(), 'connectApp')
    );
    if (connectedApp.oauthConfig && connectedApp.oauthConfig.consumerKey && connectedApp.success === true) return;
    this.createKey();
    // install plugin if not installed... maybe ask user first?
    shell('sfdx plugins|grep sfdx-waw-plugin>/dev/null || echo y | sfdx plugins:install sfdx-waw-plugin');
    try {
      const out = shellJsonSfdx<ConnectAppResult>(
        'sfdx waw:connectedapp:create -c http://localhost:1717/OauthRedirect' +
          ` -e ${this.devHubConfig.hubOrgAdminEmail}` +
          ' -s Basic,Api,Web,RefreshToken,Full' +
          ' -n "SalesforceCLI"' +
          ' -d "The single command-line interface for Salesforce." ' +
          ` -u ${this.devHubConfig.hubOrgAdminUsername}`,
        null,
        BASE_DIR,
        { SFDX_AUDIENCE_URL: this.devHubConfig.sfdcLoginUrl }
      ).result;
      await statusManager.setValue(this.devHubConfig, 1, 'connectApp', out);
      if (out.errors) throw new SfdxError(JSON.stringify(out.errors, null, 4));
    } catch (e) {
      if ((e as SfdxError).message.indexOf('NamedOrgNotFound') >= 0) {
        await this.authWebLogin(this.devHubConfig.hubOrgAlias, this.devHubConfig.instanceUrl);
        return await this.createConnectedApp();
      } else if ((e as SfdxError).message.indexOf('DUPLICATE_VALUE') < 0) throw e;
    }
    this.ux.log(chalk.green('Opening devhub, please perform required steps.'));
    shell('sfdx force:org:open -u ' + this.devHubConfig.hubOrgAdminUsername);
    this.ux.log(
      chalk.green(
        "Press [ENTER] when you've\n - Opened settings\n - Typed and clicked on App Manager in Quick Find" +
          '\n - Opened the new Connceted App Salesforce CLI\n - Clicked Edit and turned on Use digital signatures\n' +
          ' - Uploaded ' +
          this.devHubConfig.serverCert +
          '\n - Then clicked manage edit policies and updated Permitted Users to Admin approved users are pre-authorized\n' +
          ' - Clicked Manage Profiles or Managed Permission Sets and add your profile or permset.'
      )
    );
    await this.ux.prompt('[ENTER]', { required: false });
    this.ux.log(chalk.green(msgs.getMessage("Assuming you've performed all the required steps")));
  }

  public createKey(): void {
    // TODO passkey can be passed if you have one already so this process wouldn't need to be done
    const dir = path.dirname(this.devHubConfig.serverCert);
    const certName = path.basename(this.devHubConfig.serverCert);
    if (fs.existsSync(this.devHubConfig.serverCert)) return;
    mkdirSync(dir);
    // shell('openssl genrsa -des3 -passout pass:x -out server.pass.key 2048', 'inherit', dir);
    // shell('openssl rsa -passin pass:x -in server.pass.key -out server.key && rm server.pass.key', 'inherit', dir);
    // shell('openssl req -new -key server.key -out server.csr', 'inherit', dir);
    // shell(
    //     'openssl x509 -req -sha256 -days 365 -in server.csr --signkey server.key -out ' + certName,
    //     'inherit',
    //     dir
    // );
    shell(
      'openssl req -new -newkey rsa:4096 -days 365 -nodes -x509 \\\n' +
        '    -subj "/C=US/ST=Utah/L=SLC/O=Dis/CN=server" \\\n' +
        '    -keyout server.key -out ' +
        certName,
      'inherit',
      dir
    );
  }
}
