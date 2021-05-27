/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import os from 'os';
import { SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { allFlags } from '../../../lib/flags/commerce/all.flags';
import { exampleFlags } from '../../../lib/flags/commerce/convert.flags';
import { filterFlags, removeFlagBeforeAll } from '../../../lib/utils/args/flagsUtils';
import { BASE_DIR, EXAMPLE_DIR } from '../../../lib/utils/constants/properties';
import { copyFileSync, readFileSync, renameRecursive } from '../../../lib/utils/fsUtils';
import { DevHubConfig, parseJSONConfigWithFlags } from '../../../lib/utils/jsonUtils';
import { shell } from '../../../lib/utils/shell';

const TOPIC = 'examples';
const CMD = `commerce:${TOPIC}:convert`;
Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('commerce', TOPIC);

export class ExamplesConvert extends SfdxCommand {
    public static description = messages.getMessage('convert.cmdDescription');

    public static examples = [`sfdx ${CMD} --config-file ${EXAMPLE_DIR()}/convert-these.txt`]; // TODO documentation including examples and descriptions

    protected static flagsConfig = {
        ...exampleFlags,
        ...filterFlags(['configuration', 'store-number', 'store-name'], allFlags),
    };

    private devHubConfig: DevHubConfig;
    // tslint:disable-next-line:no-any
    public async run(): Promise<AnyJson> {
        // sfdx force:mdapi:convert from non force-app directory
        this.devHubConfig = await parseJSONConfigWithFlags(
            this.flags.configuration,
            ExamplesConvert.flagsConfig,
            this.flags
        );
        copyFileSync(BASE_DIR + '/sfdx-project.json', this.flags['output-dir']);
        if ((this.flags.convert as string).indexOf('-v') >= 0)
            this.flags.convert = removeFlagBeforeAll('-v', this.flags.convert);
        if (!this.flags.convert && this.devHubConfig.examplesConvert)
            this.flags.convert = this.devHubConfig.examplesConvert;
        if (this.flags.convert)
            // if you pass -v meta path to convert then don't read in the config file, basically override config file
            this.convert(this.flags.convert);
        else
            this.convert(
                readFileSync(this.devHubConfig.configFile)
                    .toString()
                    .split('\n')
                    .filter((l) => l && !l.startsWith('#'))
            ); // TODO output-dir not working with -d flag:  -d ${this.flags['output-dir']} A default package path string is required for SourceWorkspaceAdap ter.
        // this command is required to run from within an sfdx project if running from ide
        await renameRecursive(
            [{ name: 'InsertStoreNameHere', value: this.devHubConfig.storeName }],
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `${this.flags['output-dir']}/force-app`
        );
        return { convertedExamples: true };
    }

    private convert(r: string[]): void {
        r.map((l) => l.replace('$EXAMPLE_DIR', EXAMPLE_DIR()).replace('~', os.homedir())).forEach((dir) =>
            shell(
                `cd ${this.flags['output-dir'] as string} && sfdx force:mdapi:convert -r ${dir} -d ${
                    this.flags['output-dir'] as string
                }/force-app`
            )
        );
    }
}
