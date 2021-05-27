/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import chalk from 'chalk';
import { AnyJson } from '@salesforce/ts-types';
import { devHubFlags } from '../../../../lib/flags/commerce/devhub.flags';
import { scratchOrgFlags } from '../../../../lib/flags/commerce/scratchorg.flags';
import { storeFlags } from '../../../../lib/flags/commerce/store.flags';
import { filterFlags } from '../../../../lib/utils/args/flagsUtils';
import { DevHubConfig, parseJSONConfigWithFlags } from '../../../../lib/utils/jsonUtils';
import { Requires } from '../../../../lib/utils/requires';
import { shellJsonSfdx } from '../../../../lib/utils/shell';

Messages.importMessagesDirectory(__dirname);

const TOPIC = 'store';
const CMD = `commerce:${TOPIC}:quickstart:create`;
const msgs = Messages.loadMessages('commerce', TOPIC);

export class StoreQuickstartCreate extends SfdxCommand {
    public static description = msgs.getMessage('quickstart.create.cmdDescription');

    public static examples = [`sfdx ${CMD} --configuration devhub-configuration.json`];
    protected static flagsConfig = {
        ...filterFlags(['configuration'], devHubFlags),
        ...filterFlags(['scratch-org-admin-username', 'scratch-org-number'], scratchOrgFlags),
        ...filterFlags(['store-number', 'template-name', 'store-name'], storeFlags),
    };

    private devHubConfig: DevHubConfig;

    public async run(): Promise<AnyJson> {
        this.devHubConfig = await parseJSONConfigWithFlags(
            this.flags.configuration,
            StoreQuickstartCreate.flagsConfig,
            this.flags
        );
        await Requires.default(this.devHubConfig.instanceUrl).build();
        this.ux.log(
            msgs.getMessage('quickstart.create.creatingNewStoreInQueUpTo10Minutes') +
                msgs.getMessage('quickstart.create.storeName', [this.devHubConfig.storeName]) +
                msgs.getMessage('quickstart.create.orgUsername', [this.devHubConfig.templateName]) +
                msgs.getMessage('quickstart.create.cmdDescription', [this.devHubConfig.scratchOrgAdminUsername])
        );
        this.ux.startSpinner(msgs.getMessage('quickstart.create.creatingCommunity'));
        let output;
        try {
            this.ux.setSpinnerStatus(
                msgs.getMessage('quickstart.create.creatingWith', ['sfdx force:community:create'])
            );
            output = shellJsonSfdx(
                `sfdx force:community:create -u "${this.devHubConfig.scratchOrgAdminUsername}"` +
                    ` --name "${this.devHubConfig.storeName}" ` +
                    `--templatename "${this.devHubConfig.templateName}" ` +
                    `--urlpathprefix "${this.devHubConfig.storeName}" ` +
                    '--description "' +
                    msgs.getMessage('quickstart.create.storeCreatedByQuickStartScript', [this.devHubConfig.storeName]) +
                    '" --json'
            );
        } catch (e) {
            this.ux.stopSpinner(chalk.red(msgs.getMessage('quickstart.create.failed ')));
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            this.ux.log(chalk.red(JSON.stringify(e.message, null, 4)));
            const filteredMessages = [
                msgs.getMessage('quickstart.create.enterDifferentNameExists'),
                msgs.getMessage('quickstart.create.creatingYourCommunity'),
                msgs.getMessage('quickstart.create.createdByQuickStartScript'),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            ].filter((allowedMessage) => e.message.indexOf(allowedMessage) >= 0);
            if (filteredMessages.length === 0)
                throw new SfdxError(
                    msgs.getMessage('quickstart.create.unknownError') + JSON.stringify(output, null, 4)
                );
        }
        this.ux.stopSpinner(msgs.getMessage('quickstart.create.done'));
        if (output) this.ux.log(JSON.stringify(output, null, 4));
        return { quickstartCreateSuccess: true };
    }
}
