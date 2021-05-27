/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { devHubFlags } from '../../../../lib/flags/commerce/devhub.flags';
import { scratchOrgFlags } from '../../../../lib/flags/commerce/scratchorg.flags';
import { filterFlags } from '../../../../lib/utils/args/flagsUtils';
import { DevHubConfig, parseJSONConfigWithFlags } from '../../../../lib/utils/jsonUtils';
import { Requires } from '../../../../lib/utils/requires';
import { shell } from '../../../../lib/utils/shell';

Messages.importMessagesDirectory(__dirname);

const TOPIC = 'store';
const CMD = `commerce:${TOPIC}:view:all`;
const messages = Messages.loadMessages('commerce', TOPIC);

export class StoreViewAll extends SfdxCommand {
    public static description = messages.getMessage('view.all.cmdDescription');

    public static examples = [`sfdx ${CMD} --configuration devhub-configuration.json`]; // TODO documentation including examples and descriptions
    protected static flagsConfig = {
        ...filterFlags(['configuration'], devHubFlags),
        ...filterFlags(['scratch-org-admin-username', 'scratch-org-number'], scratchOrgFlags),
    };

    private devHubConfig: DevHubConfig;

    public async run(): Promise<AnyJson> {
        this.devHubConfig = await parseJSONConfigWithFlags(
            this.flags.configuration,
            StoreViewAll.flagsConfig,
            this.flags
        );
        await Requires.default(this.devHubConfig.instanceUrl).build();
        shell(
            `SFDX_DOMAIN_RETRY=5 sfdx force:org:open -u ${this.devHubConfig.scratchOrgAdminUsername} -p _ui/networks/setup/SetupNetworksPage`
        );
        return { viewedAll: true };
    }
}
