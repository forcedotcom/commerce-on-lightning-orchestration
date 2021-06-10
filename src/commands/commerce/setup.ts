/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import chalk from 'chalk';
import { AnyJson } from '@salesforce/ts-types';
import { addAllowedArgs, modifyArgFlag } from '../../lib/utils/args/flagsUtils';
import { BASE_DIR, CONFIG_DIR } from '../../lib/utils/constants/properties';
import { parseJSONConfigWithFlags } from '../../lib/utils/jsonUtils';
import { Requires } from '../../lib/utils/requires';
import { shell, shellJsonSfdx } from '../../lib/utils/shell';
import { ScratchOrgCreate } from './scratchorg/create';
import { DevhubAuth } from './devhub/auth';

Messages.importMessagesDirectory(__dirname);

const TOPIC = 'commerce';
const CMD = 'commerce:setup';
const messages = Messages.loadMessages('commerce', TOPIC);
const storeMessages = Messages.loadMessages('commerce', 'store');
const scratchorgMessages = Messages.loadMessages('commerce', 'scratchorg');
const devhubMessages = Messages.loadMessages('commerce', 'devhub');

export class Setup extends SfdxCommand {
  public static description = messages.getMessage('setup.cmdDescription');

  public static examples = [`sfdx ${CMD} --configuration devhub-configuration.json`, `sfdx ${CMD}`];

  protected static flagsConfig = {
    // TODO set these flags in a config somewhere so all scripts can use them
    configuration: flags.filepath({
      char: 'c',
      default: `${BASE_DIR}/devhub-configuration.json`,
      description: devhubMessages.getMessage('devHubFlags.configFileDescription'),
    }),
    'scratch-org-admin-username': flags.string({
      char: 'u',
      default: 'demo@1commerce.com',
      description: scratchorgMessages.getMessage('createFlags.scratchOrgAdminUsernameDescription'),
    }),
    'scratch-org-store-name': flags.string({
      char: 's',
      default: '1commerce',
      description: scratchorgMessages.getMessage('createFlags.scratchOrgStoreNameDescription'),
    }),
    'scratch-org-number': flags.integer({
      char: 'n',
      default: -1,
      description: scratchorgMessages.getMessage('createFlags.scratchOrgStoreNumberDescription'),
    }),
    'store-number': flags.integer({
      char: 'm',
      default: -1,
      description: storeMessages.getMessage('setup.storeNumberDescription'),
    }),
    type: flags.string({
      char: 'c',
      default: 'b2c',
      description: 'The type of store you want to create',
    }),
    definitionfile: flags.filepath({
      char: 'f',
      default: CONFIG_DIR() + '/store-scratch-def.json',
      description: messages.getMessage('convertFlags.configFileDescription'),
    }),
  };

  public async run(): Promise<AnyJson> {
    const scratchOrgNumber = this.flags['scratch-org-number'] as number;
    if (scratchOrgNumber < 0) {
      this.ux.log(messages.getMessage('setup.logScratchOrgNumber', [scratchOrgNumber, this.flags.configuration]));
      this.flags['scratch-org-number'] = 0;
    }
    const storeNumber = this.flags['store-number'] as number;
    if (storeNumber < 0) {
      this.ux.log(messages.getMessage('setup.logStoreNumber', [storeNumber, this.flags.configuration]));
      this.flags['store-number'] = 0;
    }
    let devHubConfig = await parseJSONConfigWithFlags(this.flags.configuration, Setup.flagsConfig, this.flags);
    await Requires.default(devHubConfig.instanceUrl).build();
    this.ux.log(chalk.green('Authing up devhub'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let output = await DevhubAuth.run(addAllowedArgs(this.argv, DevhubAuth), this.config);
    if (!output) return;
    let scratchOrgTotal: number;
    let scratchOrg = 0;
    if (scratchOrgNumber < 0 && devHubConfig.scratchOrgs) scratchOrgTotal = devHubConfig.scratchOrgs.length;
    else {
      scratchOrgTotal = scratchOrgNumber + 1;
      scratchOrg = scratchOrgNumber;
    }
    if (scratchOrg < 0) scratchOrg = 0;
    for (scratchOrg; scratchOrg < scratchOrgTotal; scratchOrg++) {
      modifyArgFlag(['-n', '--scratch-org-number'], scratchOrg.toString(), this.argv);
      devHubConfig = await parseJSONConfigWithFlags(this.flags.configuration, Setup.flagsConfig, this.flags);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      output = await ScratchOrgCreate.run(addAllowedArgs(this.argv, ScratchOrgCreate), this.config);
      if (!output)
        throw new SfdxError(messages.getMessage('setup.errorScratchOrgCreate', [devHubConfig.scratchOrgAdminUsername]));
      let storeTotal: number;
      let store = 0;
      if (scratchOrgNumber < 0)
        storeTotal = devHubConfig.scratchOrgs[scratchOrg].stores
          ? devHubConfig.scratchOrgs[scratchOrg].stores.length
          : 1;
      else {
        storeTotal = scratchOrgNumber + 1;
        store = scratchOrgNumber;
      }
      for (store; store < storeTotal; store++) {
        modifyArgFlag(['-m', '--store-number'], store.toString(), this.argv);
        devHubConfig = await parseJSONConfigWithFlags(this.flags.configuration, Setup.flagsConfig, this.flags);
        shell('sfdx plugins|grep commerce>/dev/null || echo y | sfdx plugins:install commerce');
        output = shellJsonSfdx(
          `sfdx commerce:store:create -u ${devHubConfig.scratchOrgAdminUsername} -v ${devHubConfig.hubOrgAdminUsername} -c ${devHubConfig.type} -t ${devHubConfig.definitionfile}`
        );
        if (!output)
          throw new SfdxError(
            messages.getMessage('setup.errorStoreCreate', [
              devHubConfig.storeName,
              devHubConfig.scratchOrgAdminUsername,
            ])
          );
        if (devHubConfig.paymentAdapter) {
          // install plugin if not installed... maybe ask user first?
          // TODO add this to requires
          shell('sfdx plugins|grep commerce>/dev/null || echo y | sfdx plugins:install commerce');
          output = shellJsonSfdx('sfdx commerce:payments:quickstart:setup '); // TODO pass args payment-adapter, store-name
          if (!output)
            throw new SfdxError(
              messages.getMessage('setup.errorPaymentsQuickstartSetup', [
                devHubConfig.storeName,
                devHubConfig.scratchOrgAdminUsername,
              ])
            );
        }
      }
    }
    return {};
  }
}
