/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { SfdxCommand } from '@salesforce/command';
import { fs, Messages, SfdxError } from '@salesforce/core';
import chalk from 'chalk';
import puppeteer from 'puppeteer';
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
import { mkdirSync } from '../../../lib/utils/fsUtils';

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
      ],
      scratchOrgFlags
    ),
  };
  private devHubConfig: DevHubConfig;
  private devHubDir: string;

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public static async addB2CLiteAccessPerm(scratchOrgAdminUsername: string, ux): Promise<void> {
    if (!ux) {
      ux = console;
      /* eslint-disable @typescript-eslint/no-unsafe-member-access,no-console */
      ux['setSpinnerStatus'] = console.log;
      ux['stopSpinner'] = console.log;
      ux['startSpinner'] = console.log;
      /* eslint-disable @typescript-eslint/no-unsafe-member-access,no-console */
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    ux.startSpinner('Updating required permissions');
    const browser = await puppeteer.launch({
      headless: !this.flags.showbrowser,
      args: ['--no-sandbox', '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process'],
      ignoreHTTPSErrors: true,
    });
    const openResponse = shellJsonSfdx(
      `sfdx force:org:open -p /qa/hoseMyOrgPleaseSir.jsp -u "${scratchOrgAdminUsername}" -r --json`
    );
    const url = openResponse.result['url'] as string;
    const page = await browser.newPage();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    ux.setSpinnerStatus(`opening ${url}`);
    await page.goto(url);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    ux.setSpinnerStatus(msgs.getMessage('create.waitingForStringToLoad', ['hoseMyOrgPleaseSir.jsp']));
    await page.waitForSelector('label', { timeout: 20000 });
    try {
      await page.evaluate(() => {
        Array.from(document.querySelectorAll('label'))
          .filter(
            (e) => ['B2CLiteAccess', 'CommerceEnabled'].indexOf(e.innerText) >= 0 && !e.previousSibling['checked']
          )
          .forEach((e) => (e.previousSibling['checked'] = 'checked'));
      });
      await page.click("input[value='Save']");
    } finally {
      await browser.close();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      ux.stopSpinner(msgs.getMessage('create.permsEnabled'));
    }
  }

  public static async modifyCDNAccessPerm(scratchOrgAdminUsername, ux, modifier) : Promise<void> {
    if (!ux) {
      ux = console;
      ux['setSpinnerStatus'] = console.log;
      ux['stopSpinner'] = console.log;
      ux['startSpinner'] = console.log;
    }
    ux.startSpinner('Updating required permissions');
    const browser = await puppeteer.launch({
      headless: !this.flags.showbrowser,
      args: ['--no-sandbox', '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process'],
      ignoreHTTPSErrors: true
    });
    const openResponse = await shellJsonSfdx(`sfdx force:org:open -p /qa/hoseMyOrgPleaseSir.jsp -u "${scratchOrgAdminUsername}" -r --json`);
    const url = openResponse.result['url'];
    const page = await browser.newPage();
    ux.setSpinnerStatus(`opening ${url}`);
    await page.goto(url);
    ux.setSpinnerStatus(msgs.getMessage('create.waitingForStringToLoad', ['hoseMyOrgPleaseSir.jsp']));
    await page.waitForSelector('label', { timeout: 10000 });
    if (modifier === 'remove') {
      try {
        await page.evaluate(_ => {
          Array.from(document.querySelectorAll('label'))
              .filter(e => ['ConnectCdnApiCacheEnabled', 'AcceptCdnRequestOnly', 'CdnSdcOnlyForSiteEnabled'].indexOf(e.innerText) >= 0)
              .forEach(e => e.previousSibling['checked'] = '');
        });
        await page.click("input[value='Save']", {delay: 5000});
      } finally {
        await browser.close();
        ux.stopSpinner(msgs.getMessage('create.permsDisabled'));
      }
    } else {
      try {
        await page.evaluate(_ => {
          Array.from(document.querySelectorAll('label'))
              .filter(e => ['ConnectCdnApiCacheEnabled', 'AcceptCdnRequestOnly', 'CdnSdcOnlyForSiteEnabled'].indexOf(e.innerText) >= 0)
              .forEach(e => e.previousSibling['checked'] = 'checked');
        });
        await page.click("input[value='Save']", {delay: 5000});
      } finally {
        await browser.close();
      }
    }
  }


  public async run(): Promise<AnyJson> {
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
    sfdxProject.signupTargetLoginUrl = this.devHubConfig.sfdcLoginUrl;
    this.devHubDir = DEVHUB_DIR(BASE_DIR, this.devHubConfig.hubOrgAdminUsername);
    const sfdxProjectFile = mkdirSync(this.devHubDir) + '/sfdx-project.json';
    fs.writeFileSync(sfdxProjectFile, JSON.stringify(sfdxProject, null, 4));
    await this.createScratchOrg();
    this.ux.log(chalk.green.bold(msgs.getMessage('create.completedCreatingCommunity')));
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
      mkdirSync(this.devHubDir ? this.devHubDir : BASE_DIR);
      const res = shellJsonSfdx(
        `sfdx force:org:create -f ${CONFIG_DIR()}/${this.devHubConfig.type.toLowerCase()}-project-scratch-def.json ` +
          `username="${this.devHubConfig.scratchOrgAdminUsername}" -d 30 ` +
          `--apiversion="${this.devHubConfig.apiVersion}" -a "${this.devHubConfig.scratchOrgAlias}" -s ` +
          `-v "${this.devHubConfig.hubOrgAdminUsername}" -w 15 --json`,
        null,
        this.devHubDir ? this.devHubDir : BASE_DIR,
        { SFDX_AUDIENCE_URL: this.devHubConfig.instanceUrl }
      );
      this.ux.setSpinnerStatus(chalk.green(JSON.stringify(res)));
      await statusManager.setValue(this.devHubConfig, 2, 'created', true);
      this.ux.stopSpinner(msgs.getMessage('create.successfulOrgCreation'));
    } catch (e) {
      this.ux.stopSpinner(msgs.getMessage('create.failureOrgCreation'));
      this.ux.log(JSON.stringify(e.message, null, 4));
      if (cnt > 3) {
        await statusManager.setValue(this.devHubConfig, 2, 'created', JSON.parse(JSON.stringify(e, replaceErrors)));
        throw e;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      if (e.message.indexOf('MyDomainResolverTimeoutError') >= 0) {
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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          message = JSON.parse(e.message);
        } catch (ee) {
          await statusManager.setValue(this.devHubConfig, 2, 'created', JSON.parse(JSON.stringify(e, replaceErrors)));
          throw e;
        }
        if (message.name === 'DevhubNotAuthorized' || message.name === 'genericTimeoutMessage') {
          this.log(chalk.red(msgs.getMessage('create.errorOccurredMightNeedDevhubAuth') + (message.message as string)));
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const isAuthed = await DevhubAuth.run(addAllowedArgs(this.argv, DevhubAuth), this.config);
          if (!isAuthed) {
            await statusManager.setValue(this.devHubConfig, 2, 'created', 'Auth Failed');
            throw new SfdxError(msgs.getMessage('create.authFailed'));
          }
          await this.createScratchOrg(++cnt);
        } else if (message.name === 'ACCESS_DENIED') {
          await statusManager.setValue(this.devHubConfig, 2, 'created', JSON.parse(JSON.stringify(e, replaceErrors)));
          throw e;
        } else if (
          message.name === 'RemoteOrgSignupFailed' &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          message.message.indexOf(msgs.getMessage('create.isAlreadyInUse')) < 0
        ) {
          await statusManager.setValue(this.devHubConfig, 2, 'created', JSON.parse(JSON.stringify(e, replaceErrors)));
          throw new SfdxError(
            msgs.getMessage('create.errorOccurredDuringOrgCreateMightNeedTMPAuth') + JSON.stringify(message, null, 4)
          );
        } else if (
          message.name === 'RemoteOrgSignupFailed' &&
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          message.message.indexOf(msgs.getMessage('create.pleaseTryAgain')) >= 0
        )
          await this.createScratchOrg(++cnt);
        else {
          await statusManager.setValue(this.devHubConfig, 2, 'created', JSON.parse(JSON.stringify(e, replaceErrors)));
          throw new SfdxError(e.message);
        }
      }
    }
  }
}
