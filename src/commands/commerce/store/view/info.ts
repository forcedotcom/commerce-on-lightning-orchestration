/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { URL } from 'url';
import { SfdxCommand } from '@salesforce/command';
import { fs, Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { devHubFlags } from '../../../../lib/flags/commerce/devhub.flags';
import { scratchOrgFlags } from '../../../../lib/flags/commerce/scratchorg.flags';
import { storeFlags } from '../../../../lib/flags/commerce/store.flags';
import { filterFlags } from '../../../../lib/utils/args/flagsUtils';
import { B2C_CONFIG_OVERRIDE } from '../../../../lib/utils/constants/properties';
import { DevHubConfig, parseJSONConfigWithFlags } from '../../../../lib/utils/jsonUtils';
import { Requires } from '../../../../lib/utils/requires';
import { forceDataSoql } from '../../../../lib/utils/sfdx/forceDataSoql';
import { StoreCreate } from '../create';
import { statusManager, Store } from '../../../../lib/utils/statusFileManager';

Messages.importMessagesDirectory(__dirname);

const TOPIC = 'store';
const CMD = `commerce:${TOPIC}:view:info`;
const messages = Messages.loadMessages('commerce', TOPIC);

export class StoreViewInfo extends SfdxCommand {
    public static description = messages.getMessage('view.info.cmdDescription');

    public static examples = [`sfdx ${CMD} --configuration devhub-configura tion.json`]; // TODO documentation including examples and descriptions
    protected static flagsConfig = {
        ...filterFlags(['configuration'], devHubFlags),
        ...scratchOrgFlags,
        ...filterFlags(['store-number'], storeFlags),
    };

    private devHubConfig: DevHubConfig;

    public async run(): Promise<AnyJson> {
        this.devHubConfig = await parseJSONConfigWithFlags(
            this.flags.configuration,
            StoreViewInfo.flagsConfig,
            this.flags
        );
        await Requires.default(this.devHubConfig.instanceUrl).build();
        const userInfo = await StoreCreate.getUserInfo(this.devHubConfig);
        if (!userInfo) throw new SfdxError(messages.getMessage('view.info.errorNoUserInfo'));
        const buyerPassword = userInfo.password ? userInfo.password : '';
        const fullStoreUrl = await this.getFullStoreURL();
        this.ux.log(
            messages.getMessage('view.info.storeUrlBuyerInfo', [
                fullStoreUrl,
                this.devHubConfig.scratchOrgBuyerUsername,
                buyerPassword,
            ])
        );
        const config = {
            communityUrl: fullStoreUrl,
            username: this.devHubConfig.scratchOrgBuyerUsername,
            password: buyerPassword,
        };
        const configFile = `const config = ${JSON.stringify(config, null, 4)};\nmodule.exports = config;`;
        this.ux.log(
            messages.getMessage('view.info.savingConfigIntoConfig', ['commerce.config-override.js', configFile])
        );
        fs.writeFileSync(B2C_CONFIG_OVERRIDE(), configFile); // Shall we resolve this query - 'should this write it to the scratch org directory?'
        return { viewedInfo: true };
    }

    private async getFullStoreURL(): Promise<string> {
        const fullStoreUrlKey = 'fullStoreUrl';
        const dInfo = await statusManager.getValue(this.devHubConfig, new Store(), 'fullStoreUrl');
        if (dInfo) return dInfo as string;
        const domainInfo = forceDataSoql(
            `SELECT Domain.Domain FROM DomainSite WHERE PathPrefix='/${this.devHubConfig.storeName}/s' limit 1`,
            this.devHubConfig.scratchOrgAdminUsername
        );
        if (
            !domainInfo.result.records ||
            domainInfo.result.records.length === 0 ||
            !domainInfo.result.records[0]['Domain']
        )
            throw new SfdxError(
                messages.getMessage('view.info.noStoreMatch', [
                    '[-n][--scratch-org-number]',
                    this.flags['scratch-org-number'],
                    '[-m][--store-number]',
                    this.flags['store-number'],
                ])
            );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        let domain = domainInfo.result.records[0]['Domain']['Domain'] as string;
        const instanceUrl = (await StoreCreate.getUserInfo(this.devHubConfig)).instanceUrl;
        const url = new URL(instanceUrl);
        url.hostname = domain;
        domain = url.toString() + `${this.devHubConfig.storeName}/s`;
        await statusManager.setValue(this.devHubConfig, 3, fullStoreUrlKey, domain);
        return domain;
    }
}
