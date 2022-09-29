/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { SfdxCommand } from '@salesforce/command';
import { fs, Messages, SfdxError } from '@salesforce/core';
import chalk from 'chalk';
import { AnyJson } from '@salesforce/ts-types';
import { devHubFlags } from '../../../lib/flags/commerce/devhub.flags';
import { scratchOrgFlags } from '../../../lib/flags/commerce/scratchorg.flags';
import { addAllowedArgs, filterFlags } from '../../../lib/utils/args/flagsUtils';
import { BASE_DIR, CONFIG_DIR, DEVHUB_DIR } from '../../../lib/utils/constants/properties';
import { DevHubConfig, Org, parseJSONConfigWithFlags, replaceErrors, SfdxProject } from '../../../lib/utils/jsonUtils';
import { Requires } from '../../../lib/utils/requires';
import { getOrgInfo, getScratchOrgByUsername } from '../../../lib/utils/sfdx/forceOrgList';
import { shellJsonSfdx } from '../../../lib/utils/shell';
import { sleep } from '../../../lib/utils/sleep';
import { ScratchOrg, statusManager } from '../../../lib/utils/statusFileManager';
import { DevhubAuth } from '../devhub/auth';
import { copyExampleFiles, mkdirSync } from '../../../lib/utils/fsUtils';

Messages.importMessagesDirectory(__dirname);

const TOPIC = 'scratchorg';
const CMD = `commerce:${TOPIC}:create`;
const msgs = Messages.loadMessages('commerce-orchestration', TOPIC);

export class ScratchOrgCreate extends SfdxCommand {
  public static description = msgs.getMessage('create.cmdDescription');
  public static examples = [`sfdx ${CMD} --configuration devhub-configuration.json`];

  protected static flagsConfig = {
    ...filterFlags(['configuration', 'api-version', 'hub-org-admin-username'], devHubFlags),
    ...filterFlags(
      [
        'type',
        'scratch-org-admin-username',
        'scratch-org-number',
        'scratch-org-alias',
        'is-b2c-lite-access-perm-needed',
        'prompt',
      ],
      scratchOrgFlags
    ),
  };

  private devHubConfig: DevHubConfig;
  private devHubDir: string;

  public async run(): Promise<AnyJson> {
    // copy all example files
    copyExampleFiles(this.flags.prompt);
    this.devHubConfig = await parseJSONConfigWithFlags(
      this.flags.configuration,
      ScratchOrgCreate.flagsConfig,
      this.flags
    );
    await Requires.default(/* this.devHubConfig.instanceUrl*/).build();
    this.ux.log(msgs.getMessage('create.usingScratchOrgAdmin', [this.devHubConfig.scratchOrgAdminUsername]));
    if (!getOrgInfo(this.devHubConfig.hubOrgAdminUsername))
      // TODO add this as a require, ie requires devhub
      throw new SfdxError(msgs.getMessage('create.devhubSetupWasNotCompletedSuccessfully'));
    const sfdxProject: SfdxProject = Object.assign(new SfdxProject(), fs.readJsonSync(BASE_DIR + '/sfdx-project.json'));
    sfdxProject.sourceApiVersion = this.devHubConfig.apiVersion;
    sfdxProject.sfdcLoginUrl = this.devHubConfig.instanceUrl;
    sfdxProject.signupTargetLoginUrl = this.devHubConfig.signupTargetLoginUrl
      ? this.devHubConfig.signupTargetLoginUrl
      : this.devHubConfig.sfdcLoginUrl;
    this.devHubDir = DEVHUB_DIR(BASE_DIR, this.devHubConfig.hubOrgAdminUsername);
    const sfdxProjectFile = mkdirSync(this.devHubDir) + '/sfdx-project.json';
    fs.writeFileSync(sfdxProjectFile, JSON.stringify(sfdxProject, null, 4));
    await this.createScratchOrg();
    this.ux.log(chalk.green.bold(msgs.getMessage('create.completedCreatingScratchOrg')));
    this.ux.log(chalk.green.bold(msgs.getMessage('create.allDoneProceedCreatingNewStore', ['commerce:store:create'])));
    return { scratchOrgCreated: true };
  }
  private async getScratchOrg(): Promise<Org> {
    const scratchOrg = getScratchOrgByUsername(this.devHubConfig.scratchOrgAdminUsername);
    if (scratchOrg) {
      this.ux.setSpinnerStatus(msgs.getMessage('create.orgExists') + JSON.stringify(scratchOrg));
      await statusManager.setValue(this.devHubConfig, 2, 'created', true);
      return scratchOrg;
    }
    return null;
  }

  private async createScratchOrg(cnt = 0): Promise<void> {
    // TODO change all checkpoints to requires
    if (
      (await statusManager.getValue(this.devHubConfig, new ScratchOrg(), 'created')) === 'true' ||
      (await this.getScratchOrg())
    )
      return await statusManager.setValue(this.devHubConfig, 2, 'created', true);
    // TODO maybe add a last_update or step here it is quick so maybe not
    this.ux.log(msgs.getMessage('create.preparingResourcesEtc'));
    this.ux.log(
      msgs.getMessage('create.creatingNewScratchOrgInfo') +
        msgs.getMessage('create.apiVersion', [this.devHubConfig.apiVersion]) +
        msgs.getMessage('create.hubOrgAlias', [this.devHubConfig.hubOrgAlias]) +
        msgs.getMessage('create.scratchOrgAdminUsername', [this.devHubConfig.scratchOrgAdminUsername]) +
        msgs.getMessage('create.thisMayTakeAFewMins')
    );
    this.ux.log(`${CONFIG_DIR()}/${this.devHubConfig.type.toLowerCase()}-project-scratch-def.json`);
    this.ux.startSpinner(msgs.getMessage('create.creatingNewScratchOrg'));
    try {
      this.ux.setSpinnerStatus(msgs.getMessage('create.using', ['sfdx force:org:create']));
      mkdirSync((this.devHubDir ? this.devHubDir : BASE_DIR) + '/force-app');
      const res = shellJsonSfdx(
        `sfdx force:org:create -f ${CONFIG_DIR()}/${this.devHubConfig.type.toLowerCase()}-project-scratch-def.json ` +
          `username="${this.devHubConfig.scratchOrgAdminUsername}" -d 30 ` +
          `--apiversion="${this.devHubConfig.apiVersion}" -a "${this.devHubConfig.scratchOrgAlias}" -s ` +
          `-v "${this.devHubConfig.hubOrgAdminUsername}" -w 15 --json`,
        null,
        this.devHubConfig.orgCreateDir
          ? this.devHubConfig.orgCreateDir.replace('$(BASE_DIR)', BASE_DIR).replace('$(DEV_HUB_DIR)', this.devHubDir)
          : '/tmp',
        // this.devHubDir ? this.devHubDir : BASE_DIR,
        {
          SFDX_AUDIENCE_URL: this.devHubConfig.instanceUrl,
          SFDX_SCRATCH_ORG_CREATION_LOGIN_URL: this.devHubConfig.signupTargetLoginUrl,
        }
      );
      this.ux.setSpinnerStatus(chalk.green(JSON.stringify(res)));
      await statusManager.setValue(this.devHubConfig, 2, 'created', true);
      this.ux.stopSpinner(msgs.getMessage('create.successfulOrgCreation'));
    } catch (e) {
      this.ux.stopSpinner(msgs.getMessage('create.failureOrgCreation'));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.ux.log(JSON.stringify(e.message, null, 4));
      if (cnt > 3) {
        await statusManager.setValue(this.devHubConfig, 2, 'created', JSON.parse(JSON.stringify(e, replaceErrors)));
        throw e;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      if (e.message.indexOf('MyDomainResolverTimeoutError') >= 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.ux.log(JSON.stringify(e.message, null, 4));
        this.ux.startSpinner(msgs.getMessage('create.sleepingBeforeCheckingIfOrgIsCreated'));
        let count = 0;
        while (!(await this.getScratchOrg())) {
          await sleep(10 * 1000);
          if (count++ > 60) {
            await statusManager.setValue(this.devHubConfig, 2, 'created', JSON.parse(JSON.stringify(e, replaceErrors)));
            throw new SfdxError(msgs.getMessage('create.waitedTimeStillNoOrgCreated', ['10 minutes']));
          }
        }
        this.ux.stopSpinner(msgs.getMessage('create.scratchOrgNowExists'));
        // throw e;
      } else {
        let message;
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
          message = JSON.parse(e.message);
        } catch (ee) {
          await statusManager.setValue(this.devHubConfig, 2, 'created', JSON.parse(JSON.stringify(e, replaceErrors)));
          throw e;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (message.name === 'DevhubNotAuthorized' || message.name === 'genericTimeoutMessage') {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          this.log(chalk.red(msgs.getMessage('create.errorOccurredMightNeedDevhubAuth') + (message.message as string)));
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const isAuthed = await DevhubAuth.run(addAllowedArgs(this.argv, DevhubAuth), this.config);
          if (!isAuthed) {
            await statusManager.setValue(this.devHubConfig, 2, 'created', 'Auth Failed');
            throw new SfdxError(msgs.getMessage('create.authFailed'));
          }
          await this.createScratchOrg(++cnt);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        } else if (message.name === 'ACCESS_DENIED') {
          await statusManager.setValue(this.devHubConfig, 2, 'created', JSON.parse(JSON.stringify(e, replaceErrors)));
          throw e;
        } else if (
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          message.name === 'RemoteOrgSignupFailed' &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          message.message.indexOf(msgs.getMessage('create.isAlreadyInUse')) < 0
        ) {
          await statusManager.setValue(this.devHubConfig, 2, 'created', JSON.parse(JSON.stringify(e, replaceErrors)));
          throw new SfdxError(
            msgs.getMessage('create.errorOccurredDuringOrgCreateMightNeedTMPAuth') + JSON.stringify(message, null, 4)
          );
        } else if (
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          message.name === 'RemoteOrgSignupFailed' &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          message.message.indexOf(msgs.getMessage('create.pleaseTryAgain')) >= 0
        )
          await this.createScratchOrg(++cnt);
        else {
          await statusManager.setValue(this.devHubConfig, 2, 'created', JSON.parse(JSON.stringify(e, replaceErrors)));
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          throw new SfdxError(e.message);
        }
      }
    }
  }
}
