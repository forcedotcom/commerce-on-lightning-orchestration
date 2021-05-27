/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import os from 'os';
import { SfdxCommand } from '@salesforce/command';
import { fs, Messages, SfdxError } from '@salesforce/core';
import chalk from 'chalk';
import { AnyJson } from '@salesforce/ts-types';
import { allFlags } from '../../../lib/flags/commerce/all.flags';
import { addAllowedArgs, filterFlags } from '../../../lib/utils/args/flagsUtils';
import { BASE_DIR, BUYER_USER_DEF, SCRATCH_ORG_DIR, STORE_DIR } from '../../../lib/utils/constants/properties';
import {
    BuyerUserDef,
    DevHubConfig,
    parseJSONConfigWithFlags,
    replaceErrors,
    UserInfo,
} from '../../../lib/utils/jsonUtils';
import { Requires } from '../../../lib/utils/requires';
import { forceDataSoql } from '../../../lib/utils/sfdx/forceDataSoql';
import { getHubOrgByUsername, getScratchOrgByUsername } from '../../../lib/utils/sfdx/forceOrgList';
import { shell, shellJsonSfdx } from '../../../lib/utils/shell';
import { sleep } from '../../../lib/utils/sleep';
import { statusManager, Store } from '../../../lib/utils/statusFileManager';
import { DevhubAuth } from '../devhub/auth';
import { ScratchOrgCreate } from '../scratchorg/create';
import { StoreQuickstartCreate } from './quickstart/create';
import { StoreQuickstartSetup } from './quickstart/setup';
import { StoreView } from './view';

Messages.importMessagesDirectory(__dirname);

const TOPIC = 'store';
const CMD = `commerce:${TOPIC}:create`;
const msgs = Messages.loadMessages('commerce', TOPIC);

export class StoreCreate extends SfdxCommand {
    public static description = msgs.getMessage('create.cmdDescription');
    public static examples = [`sfdx ${CMD} --configuration devhub-configuration.json`];
    protected static flagsConfig = filterFlags(
        [
            'configuration',
            'scratch-org-admin-username',
            'store-name',
            'store-number',
            'scratch-org-number',
            'scratch-org-buyer-username',
            'template-name',
        ],
        allFlags
    );
    private devHubConfig: DevHubConfig;
    private storeDir;

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public static async getStoreId(devHubConfig: DevHubConfig, ux, cnt = 0, setPerms = true): Promise<string> {
        let storeId = (await statusManager.getValue(devHubConfig, new Store(), 'id')) as string;
        if (storeId && storeId !== 'undefined') return storeId;
        try {
            const res = forceDataSoql(
                `SELECT Id FROM WebStore WHERE Name='${devHubConfig.storeName}' LIMIT 1`,
                devHubConfig.scratchOrgAdminUsername
            );
            if (!res.result.records || res.result.records.length === 0 || !res.result.records[0]) return null;
            storeId = res.result.records[0].Id;
        } catch (e) {
            /* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access */
            if (e.message.indexOf(msgs.getMessage('create.webStoreNotSupported')) >= 0 && setPerms) {
                if (cnt > 0) {
                    ux.log(chalk.green(msgs.getMessage('create.automaticallySettingPermFailedPleaseDoItManually')));
                    shell(
                        `sfdx force:org:open -u "${devHubConfig.scratchOrgAdminUsername}" -p /qa/hoseMyOrgPleaseSir.jsp`
                    );
                    ux.log(chalk.green(msgs.getMessage('create.pressEnterWhenPermIsSet')));
                    await ux.prompt(msgs.getMessage('create.enter'), { required: false });
                    ux.log(chalk.green(msgs.getMessage('create.assumingYouSavedThePerm')));
                    /* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access */
                    return await this.getStoreId(devHubConfig, ux, ++cnt);
                }
                await ScratchOrgCreate.addB2CLiteAccessPerm(devHubConfig.scratchOrgAdminUsername, ux);
                return await this.getStoreId(devHubConfig, ux, ++cnt);
            } else throw e;
        }
        await statusManager.setValue(devHubConfig, 3, 'id', storeId);
        return storeId;
    }
    // does this belong here?
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public static async waitForStoreId(devHubConfig: DevHubConfig, ux, time = 10 * 3): Promise<void> {
        if (!ux || !ux.stopSpinner) {
            ux = console;
            /* eslint-disable no-console */
            ux['setSpinnerStatus'] = console.log;
            ux['stopSpinner'] = console.log;
            ux['startSpinner'] = console.log;
            /* eslint-disable no-console */
        }
        ux.setSpinnerStatus(msgs.getMessage('create.waitingForWebStoreId'));
        let count = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (await StoreCreate.getStoreId(devHubConfig, ux))
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return ux.stopSpinner(
                    `${msgs.getMessage('create.doneWithStoreId')} ${await StoreCreate.getStoreId(devHubConfig, ux)}`
                );
            ux.setSpinnerStatus('Store not yet created, waiting 10 seconds...');
            await sleep(10 * 1000);
            ux.setSpinnerStatus(msgs.getMessage('create.stillWaiting'));
            if (count++ > time)
                // 5 minutes
                throw new SfdxError(msgs.getMessage('create.waited5MinNoStoreId'));
        }
    }

    public static async getUserInfo(devHubConfig: DevHubConfig): Promise<UserInfo> {
        if (await statusManager.getValue(devHubConfig, new Store(), 'userInfo')) {
            const userInfo = Object.assign(
                new UserInfo(),
                await statusManager.getValue(devHubConfig, new Store(), 'userInfo')
            );
            if (userInfo && userInfo.id) return userInfo;
        }
        try {
            const output = shellJsonSfdx(
                `sfdx force:user:display -u "${devHubConfig.scratchOrgBuyerUsername}" ${
                    devHubConfig.hubOrgAdminUsername ? '-v "' + devHubConfig.hubOrgAdminUsername + '"' : ''
                } --json`
            );
            console.log(JSON.stringify(output));
            await statusManager.setValue(devHubConfig, 3, 'userInfo', output.result);
            return Object.assign(new UserInfo(), output.result);
        } catch (e) {
            console.log(JSON.stringify(e, null, 4));
        }
    }
    public async run(): Promise<AnyJson> {
        this.devHubConfig = await parseJSONConfigWithFlags(
            this.flags.configuration,
            StoreCreate.flagsConfig,
            this.flags
        );
        await Requires.default(this.devHubConfig.instanceUrl).build();
        this.storeDir = STORE_DIR(
            BASE_DIR,
            this.devHubConfig.hubOrgAdminUsername,
            this.devHubConfig.scratchOrgAdminUsername,
            this.devHubConfig.storeName
        );
        if (await statusManager.getValue(this.devHubConfig, new Store(), 'done')) {
            this.ux.log(msgs.getMessage('create.statusIndicatesCompletedSkipping'));
            return { createdStore: true };
        }
        this.ux.log(
            msgs.getMessage('create.messageIntentToCreateInfo', [
                this.devHubConfig.scratchOrgAdminUsername,
                this.devHubConfig.scratchOrgBuyerUsername,
                this.devHubConfig.templateName,
                this.devHubConfig.storeName,
            ])
        );
        const devhub = getHubOrgByUsername(this.devHubConfig.hubOrgAdminUsername);
        if (!devhub) throw new SfdxError('No devhub with username: ' + this.devHubConfig.hubOrgAdminUsername);
        if (devhub['connectedStatus'] === 'Session expired or invalid') {
            shellJsonSfdx('sfdx force:auth:logout -p -u ' + this.devHubConfig.hubOrgAdminUsername);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const auth = await DevhubAuth.run(addAllowedArgs(this.argv, DevhubAuth), this.config);
            if (!auth) throw new SfdxError('No devhub with username: ' + this.devHubConfig.hubOrgAdminUsername);
        }
        if (!getScratchOrgByUsername(this.devHubConfig.scratchOrgAdminUsername))
            throw new SfdxError(
                msgs.getMessage('create.errorNoScratchOrgExistsWithUsername') +
                    this.devHubConfig.scratchOrgAdminUsername
            );
        if (
            !this.devHubConfig.buyerEmail ||
            this.devHubConfig.buyerEmail.indexOf('scratchOrgBuyerUsername.replace') >= 0
        )
            this.devHubConfig.buyerEmail = `${
                os.userInfo().username
            }+${this.devHubConfig.scratchOrgBuyerUsername.replace('@', 'AT')}@salesforce.com`;
        if (!this.devHubConfig.existingBuyerAuthentication)
            this.devHubConfig['existingBuyerAuthentication'] = `${os.homedir()}/.sfdx/${
                this.devHubConfig.scratchOrgBuyerUsername
            }.json`;
        this.ux.log(msgs.getMessage('create.removingSfdxAuthFile', [this.devHubConfig.existingBuyerAuthentication]));
        try {
            fs.removeSync(this.devHubConfig.existingBuyerAuthentication);
        } catch (e) {
            /* Don't care if it doesn't exist*/
        }
        const buyerUserDefTemplate = new BuyerUserDef();
        buyerUserDefTemplate.username = this.devHubConfig.scratchOrgBuyerUsername;
        buyerUserDefTemplate.email = this.devHubConfig.buyerEmail;
        buyerUserDefTemplate.alias = this.devHubConfig.buyerAlias;
        fs.writeFileSync(BUYER_USER_DEF(this.storeDir), JSON.stringify(buyerUserDefTemplate, null, 4));
        await this.createCommunity();
        this.ux.log(chalk.green.bold(msgs.getMessage('create.completedStep6')));
        this.ux.log(msgs.getMessage('create.communityNowAvailable'));
        await this.pushStoreSources();
        this.ux.log(chalk.green.bold(msgs.getMessage('create.completedStep7')));
        await this.assignShopperProfileToBuyerUser();
        this.ux.log(chalk.green.bold(msgs.getMessage('create.completedStep8')));
        await this.createSearchIndex();
        this.ux.log(msgs.getMessage('create.openingBrowserTheStoreAdminPage'));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const res = await StoreView.run(addAllowedArgs(this.argv, StoreView), this.config);
        if (!res) return;
        this.ux.log(chalk.green.bold(msgs.getMessage('create.allDone'))); // don't delete the status file here. Status file deleted with reset.
        await statusManager.setValue(this.devHubConfig, 3, 'done', true);
        return { createdStore: true };
    }

    private async createCommunity(cnt = 0): Promise<void> {
        try {
            if (await StoreCreate.getStoreId(this.devHubConfig, this.ux, 0, false)) return;
        } catch (e) {
            /* Expect exception here if store hasn't been created yet*/
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const res = await StoreQuickstartCreate.run(addAllowedArgs(this.argv, StoreQuickstartCreate), this.config);
        if (!res) throw new SfdxError(msgs.getMessage('create.errorStoreQuickstartCreateFailed'));
        this.ux.startSpinner(msgs.getMessage('create.waitingForCommunity'));
        try {
            await StoreCreate.waitForStoreId(this.devHubConfig, this.ux, 2);
        } catch (e) {
            if (cnt > 10) {
                await statusManager.setValue(this.devHubConfig, 3, 'id', JSON.parse(JSON.stringify(e, replaceErrors)));
                throw e;
            }
            this.ux.setSpinnerStatus(msgs.getMessage('create.communityStillNotAvailableCount', [cnt]));
            await this.createCommunity(++cnt);
        }
        this.ux.stopSpinner(msgs.getMessage('create.communityNowAvailable'));
    }

    private async pushStoreSources(): Promise<void> {
        if ((await statusManager.getValue(this.devHubConfig, new Store(), 'pushedSources')) === 'true') return;
        const scratchOrgDir = SCRATCH_ORG_DIR(
            BASE_DIR,
            this.devHubConfig.hubOrgAdminUsername,
            this.devHubConfig.scratchOrgAdminUsername
        );
        try {
            fs.removeSync(scratchOrgDir + '/force-app');
        } catch (e) {
            /* IGNORE */
        }
        await new Requires()
            .examplesConverted(scratchOrgDir, this.flags.configuration, this.devHubConfig.storeName)
            .build();
        this.ux.startSpinner(msgs.getMessage('create.pushingStoreSources'));
        try {
            this.ux.setSpinnerStatus(msgs.getMessage('create.using', ['sfdx force:source:push']));
            shellJsonSfdx(
                `cd ${scratchOrgDir} && sfdx force:source:push -f -u "${this.devHubConfig.scratchOrgAdminUsername}"`
            );
        } catch (e) {
            if (e.message && JSON.stringify(e.message).indexOf(msgs.getMessage('create.checkInvalidSession')) >= 0) {
                this.ux.log(msgs.getMessage('create.preMessageOpeningPageSessinonRefresh', [e.message]));
                shell('sfdx force:org:open -u ' + this.devHubConfig.scratchOrgAdminUsername); // todo might puppet this
                shellJsonSfdx(
                    `cd ${scratchOrgDir} && sfdx force:source:push -f -u "${this.devHubConfig.scratchOrgAdminUsername}"`
                );
            } else {
                await statusManager.setValue(
                    this.devHubConfig,
                    3,
                    'pushedSources',
                    JSON.parse(JSON.stringify(e, replaceErrors))
                );
                throw e;
            }
        }
        this.ux.stopSpinner(msgs.getMessage('create.done'));
        this.ux.log(
            msgs.getMessage('create.settingUpStoreBuyerCreateBuyerWithInfo', [
                this.devHubConfig.scratchOrgBuyerUsername,
                this.devHubConfig.buyerEmail,
                this.devHubConfig.buyerAlias,
            ])
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const res = await StoreQuickstartSetup.run(addAllowedArgs(this.argv, StoreQuickstartSetup), this.config); // don't use spinner for calling other commands
        if (!res) throw new SfdxError(msgs.getMessage('create.errorStoreQuickstartSetupFailed'));
        this.ux.log(msgs.getMessage('create.done'));
        await statusManager.setValue(this.devHubConfig, 3, 'pushedSources', true);
    }

    private async assignShopperProfileToBuyerUser(): Promise<void> {
        let userInfo;
        if (
            (await statusManager.getValue(this.devHubConfig, new Store(), 'assignedShopperProfileToBuyerUser')) ===
            'true'
        )
            if (!(await statusManager.getValue(this.devHubConfig, new Store(), 'userInfo')))
                try {
                    userInfo = StoreCreate.getUserInfo(this.devHubConfig);
                    if (userInfo) return await statusManager.setValue(this.devHubConfig, 3, 'userInfo', userInfo);
                } catch (e) {
                    /* DO nothing it creates it below*/
                }
            else return;
        this.ux.log(msgs.getMessage('create.assigningShopperProfileToBuyer'));
        shell(
            'sfdx force:user:permset:assign --permsetname CommerceUser ' +
                `--targetusername "${this.devHubConfig.scratchOrgAdminUsername}"  --onbehalfof "${this.devHubConfig.scratchOrgBuyerUsername}"`
        );
        this.ux.log(msgs.getMessage('create.changingPasswordForBuyer'));
        try {
            shellJsonSfdx(
                `sfdx force:user:password:generate -u "${this.devHubConfig.scratchOrgAdminUsername}" -o "${this.devHubConfig.scratchOrgBuyerUsername}" -v "${this.devHubConfig.hubOrgAdminUsername}"`
            );
        } catch (e) {
            if (e.message.indexOf('INSUFFICIENT_ACCESS') < 0) {
                await statusManager.setValue(
                    this.devHubConfig,
                    3,
                    'userInfo',
                    JSON.parse(JSON.stringify(e, replaceErrors))
                );
                throw e;
            }
            this.ux.log(chalk.red.bold(JSON.parse(e.message).message));
        }
        userInfo = await StoreCreate.getUserInfo(this.devHubConfig);
        await statusManager.setValue(this.devHubConfig, 3, 'userInfo', userInfo);
    }

    private async createSearchIndex(): Promise<void> {
        if ((await statusManager.getValue(this.devHubConfig, new Store(), 'indexCreated')) === 'true') return;
        this.ux.log(
            msgs.getMessage('create.createSearchIndexInfo', ['https://github.com/forcedotcom/sfdx-1commerce-plugin'])
        );
        shell(
            `sfdx 1commerce:search:start -u "${this.devHubConfig.scratchOrgAdminUsername}" -n "${this.devHubConfig.storeName}"`
        );
        // TODO check if index was created successfully, all i can do is assume it was
        await statusManager.setValue(this.devHubConfig, 3, 'indexCreated', true);
    }
}
