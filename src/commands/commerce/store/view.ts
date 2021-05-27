/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { allFlags } from '../../../lib/flags/commerce/all.flags';
import { addAllowedArgs, filterFlags } from '../../../lib/utils/args/flagsUtils';
import { DevHubConfig, parseJSONConfigWithFlags } from '../../../lib/utils/jsonUtils';
import { Requires } from '../../../lib/utils/requires';
import { shell } from '../../../lib/utils/shell';
import { StoreCreate } from './create';
import { StoreViewInfo } from './view/info';

Messages.importMessagesDirectory(__dirname);

const TOPIC = 'store';
const CMD = `commerce:${TOPIC}:view`;
const messages = Messages.loadMessages('commerce', TOPIC);

export class StoreView extends SfdxCommand {
    public static description = messages.getMessage('view.cmdDescription');

    public static examples = [`sfdx ${CMD} --configuration devhub-configuration.json`];
    protected static flagsConfig = filterFlags(
        [
            'configuration',
            'scratch-org-admin-username',
            'scratch-org-number',
            'scratch-org-name',
            'store-number',
            'store-name',
        ],
        allFlags
    );

    private devHubConfig: DevHubConfig;

    public async run(): Promise<AnyJson> {
        this.devHubConfig = await parseJSONConfigWithFlags(this.flags.configuration, StoreView.flagsConfig, this.flags);
        await Requires.default(this.devHubConfig.instanceUrl).build();
        const storeId = await StoreCreate.getStoreId(this.devHubConfig, this.ux);
        if (!storeId) throw new SfdxError(messages.getMessage('view.errorStoreId'));
        this.ux.log('Store id is: ' + storeId);
        await StoreViewInfo.run(addAllowedArgs(this.argv, StoreViewInfo), this.config);
        shell(
            `SFDX_DOMAIN_RETRY=5 sfdx force:org:open -p "/lightning/r/WebStore/${storeId}/view" -u ${this.devHubConfig.scratchOrgAdminUsername}`
        );
        return { storeId };
    }
}
