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
import { productsFlags } from '../../../lib/flags/commerce/products.flags';
import { scratchOrgFlags } from '../../../lib/flags/commerce/scratchorg.flags';
import { storeFlags } from '../../../lib/flags/commerce/store.flags';
import { filterFlags } from '../../../lib/utils/args/flagsUtils';
import { BASE_DIR, JSON_DIR, STORE_DIR } from '../../../lib/utils/constants/properties';
import { DevHubConfig, ImportResult, parseJSONConfigWithFlags, replaceErrors } from '../../../lib/utils/jsonUtils';
import { Requires } from '../../../lib/utils/requires';
import { forceDataRecordCreate, forceDataSoql } from '../../../lib/utils/sfdx/forceDataSoql';
import { shellJsonSfdx } from '../../../lib/utils/shell';
import { statusManager } from '../../../lib/utils/statusFileManager';
import { StoreCreate } from '../store/create';

Messages.importMessagesDirectory(__dirname);

const TOPIC = 'products';
const CMD = `commerce:${TOPIC}:import`;
const msgs = Messages.loadMessages('commerce', TOPIC);

export class ProductsImport extends SfdxCommand {
    public static description = msgs.getMessage('import.cmdDescription');

    public static examples = [`sfdx ${CMD} --configuration devhub-configuration.json`];
    protected static flagsConfig = {
        ...productsFlags,
        ...filterFlags(['configuration'], devHubFlags),
        ...filterFlags(['scratch-org-number', 'scratch-org-admin-username'], scratchOrgFlags),
        ...filterFlags(['store-number', 'store-name'], storeFlags),
    };

    private devHubConfig: DevHubConfig;

    private storeDir;

    // tslint:disable-next-line:no-any
    public async run(): Promise<AnyJson> {
        this.devHubConfig = await parseJSONConfigWithFlags(
            this.flags.configuration,
            ProductsImport.flagsConfig,
            this.flags
        );
        await Requires.default(this.devHubConfig.instanceUrl).build();
        this.storeDir = STORE_DIR(
            BASE_DIR,
            this.devHubConfig.hubOrgAdminUsername,
            this.devHubConfig.scratchOrgAdminUsername,
            this.devHubConfig.storeName
        );
        // TODO figure out what is a prerequisite to run this script
        this.ux.log(chalk.green(msgs.getMessage('import.importingProducts')));
        const storeId = await StoreCreate.getStoreId(this.devHubConfig, this.ux);
        let buyerGroupName;
        if (this.devHubConfig.productsFileCsv) {
            this.ux.startSpinner(msgs.getMessage('import.importingProducts'));
            this.ux.setSpinnerStatus(msgs.getMessage('import.uploading'));
            try {
                let res = shellJsonSfdx<ImportResult>(
                    `sfdx shane:data:file:upload -f ${this.devHubConfig.productsFileCsv} -u "${this.devHubConfig.scratchOrgAdminUsername}" --json`
                );
                this.ux.setSpinnerStatus(
                    msgs.getMessage('import.uploadedStringWithResult', [this.devHubConfig.productsFileCsv]) +
                        JSON.stringify(res)
                );
                const importFileId = res.result.Id;
                if (!importFileId) throw new SfdxError(msgs.getMessage('import.somethingWentW rongNoImportFileId')); // maybe just do product less import if this fails
                this.ux.setSpinnerStatus(
                    msgs.getMessage('import.importingProductsImportFileIdAndStoreId', [importFileId, storeId])
                );
                try {
                    res = shellJsonSfdx(
                        `sfdx 1commerce:import:products -d "${importFileId}" -w "${storeId}" -u "${this.devHubConfig.scratchOrgAdminUsername}"`
                    );
                } catch (e) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                    if (e.message.indexOf('UniqueConstraintViolationException') < 0) {
                        await statusManager.setValue(
                            this.devHubConfig,
                            3,
                            'productsImported',
                            JSON.parse(JSON.stringify(e, replaceErrors))
                        );
                        throw e;
                    }
                }
                this.ux.stopSpinner(msgs.getMessage('import.doneImportingProductsRes') + JSON.stringify(res));
                if (res.name === 'ERRORED') {
                    // this doesn't do anything because i'm not catching the exception... but do i want to?
                    this.ux.log(
                        chalk.red.bold(
                            msgs.getMessage('import.failedToImportProductsStringDoingProductlessImport', [
                                JSON.stringify(res, null, 4),
                            ])
                        )
                    );
                    buyerGroupName = this.productLessImport();
                } else
                    buyerGroupName = forceDataSoql(
                        `SELECT name FROM BuyerGroup where name = '${this.devHubConfig.storeName} Buyer Group' LIMIT 1`,
                        this.devHubConfig.scratchOrgAdminUsername
                    ).result.records[0].Name;
            } catch (e) {
                await statusManager.setValue(
                    this.devHubConfig,
                    3,
                    'productsImported',
                    JSON.parse(JSON.stringify(e, replaceErrors))
                );
                throw e;
            }
        } else buyerGroupName = await this.productLessImport();
        if (!buyerGroupName) {
            await statusManager.setValue(
                this.devHubConfig,
                3,
                'productsImported',
                msgs.getMessage('import.failedNoBuyerGroupName')
            );
            throw new SfdxError(msgs.getMessage('import.somethingWentWrongNoBuyerGroupName '));
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        return { buyerGroupName };
    }

    public async productLessImport(): Promise<string> {
        this.ux.log(msgs.getMessage('import.doingProductlessImport'));
        const storeId = await StoreCreate.getStoreId(this.devHubConfig, this.ux);
        const templates = ['WebStorePricebooks', 'WebStoreCatalogs', 'WebStoreBuyerGroups'];
        templates.forEach((f) =>
            fs.writeFileSync(
                JSON_DIR(this.storeDir) + `/${f}.json`,
                fs
                    .readFileSync(JSON_DIR() + `/${f}-template.json`)
                    .toString()
                    .replace('PutWebStoreIdHere', storeId)
            )
        );
        this.ux.log(msgs.getMessage('import.getStandardPricebooksForStoreReplaceJsonFiles'));
        const pricebook1 = forceDataSoql(
            "SELECT Id FROM Pricebook2 WHERE Name='Standard Price Book' AND IsStandard=true LIMIT 1",
            this.devHubConfig.scratchOrgAdminUsername
        ).result.records[0].Id;
        fs.writeFileSync(
            JSON_DIR(this.storeDir) + '/PricebookEntrys.json',
            fs
                .readFileSync(JSON_DIR() + '/PricebookEntrys-template.json')
                .toString()
                .replace('PutStandardPricebookHere', pricebook1)
        );
        // Buyer Group
        const numberofbuyergroups = forceDataSoql(
            'SELECT COUNT(Id) FROM BuyerGroup',
            this.devHubConfig.scratchOrgAdminUsername
        ).result.records[0]['expr0'] as number;
        const newNumber = numberofbuyergroups + 1;
        const newbuyergroupname = `BUYERGROUP_FROM_QUICKSTART_${newNumber}`;
        fs.writeFileSync(
            JSON_DIR(this.storeDir) + 'BuyerGroups.json',
            fs
                .readFileSync(JSON_DIR() + '/BuyerGroups-template.json')
                .toString()
                .replace('PutBuyerGroupHere', newbuyergroupname)
                .replace('PutStoreNameHere', this.devHubConfig.scratchOrgStoreName)
        );
        // Determine if Product-less insert or Product ins ert is needed.
        // For now, if there is at least 1 match, skip inser ting products.
        // Down the line, explore Bulk Upsert if people de lete Products.
        // Workaround, use throwaway community to delete all products to trigger re-insert.
        const productq = forceDataSoql(
            "SELECT COUNT(Id) FROM Product2 WHERE StockKeepingUnit In ('B-C-COFMAC-001', 'DRW-1', 'SS-DR-BB', 'ESP-001', 'TM-COFMAC-001', 'ESP-IOT-1', 'ID-PEM', 'TR-COFMAC-001', 'LRW-1', 'MRC-1', 'CP-2', 'GDG-1', 'E-ESP-001', 'ID-CAP-II', 'PS-DB', 'Q85YQ2', 'CCG-1', 'CERCG-1', 'CF-1', 'E-MR-B', 'ID-CAP-III', 'PS-EL', 'EM-ESP-001', 'CP-3', 'CL-DR-BB', 'CR-DEC', 'CREV-DR-BLEND', 'CM-MSB-300', 'COF-FIL', 'CP-1')",
            this.devHubConfig.scratchOrgAdminUsername
        ).result.records[0]['expr0'] as number;
        if (productq > 0) {
            // Grab Product IDs to create Product Entitlements
            const products = forceDataSoql(
                "SELECT Id FROM Product2 WHERE StockKeepingUnit In ('B-C-COFMAC-001', 'DRW-1', 'SS-DR-BB', 'ESP-001', 'TM-COFMAC-001', 'ESP-IOT-1', 'ID-PEM', 'TR-COFMAC-001', 'LRW-1', 'MRC-1', 'CP-2', 'GDG-1', 'E-ESP-001', 'ID-CAP-II', 'PS-DB', 'Q85YQ2', 'CCG-1', 'CERCG-1', 'CF-1', 'E-MR-B', 'ID-CAP-III', 'PS-EL', 'EM-ESP-001', 'CP-3', 'CL-DR-BB', 'CR-DEC', 'CREV-DR-BLEND', 'CM-MSB-300', 'COF-FIL', 'CP-1')",
                this.devHubConfig.scratchOrgAdminUsername
            ).result.records; // [0].Id
            // Load Product IDs into array
            const productArray = products.map((row) => row.Id); // figur e this out
            // Import Productless data
            try {
                shellJsonSfdx(
                    `sfdx force:data:tree:import -u "${this.devHubConfig.scratchOrgAdminUsername}" -p ${JSON_DIR(
                        this.storeDir
                    )}/Productless-Plan-1.json`
                );
            } catch (e) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                if (e.message.indexOf('LIMIT_EXCEEDED') < 0 && e.message.indexOf('DUPLICATE_VALUE') < 0) throw e;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                this.ux.log(JSON.parse(e.message).err);
            }
            // Get newly created Entitlement Policy ID
            const policyID = forceDataSoql(
                'SELECT Id FROM CommerceEntitlementPolicy ORDER BY CreatedDate Desc LIMIT 1',
                this.devHubConfig.scratchOrgAdminUsername
            ).result.records[0].Id;
            // Create new Product Entitlement records
            productArray.forEach((product) =>
                this.ux.log(
                    JSON.stringify(
                        forceDataRecordCreate(
                            'CommerceEntitlementProduct',
                            `PolicyId='${policyID}' ProductId='${product}'`,
                            this.devHubConfig.scratchOrgAdminUsername
                        )
                    )
                )
            );
            // Add Store Catalog mapping
            const catalogId = forceDataSoql(
                "SELECT Id FROM ProductCatalog WHERE Name='CATALOG_FROM_QUICKSTART' ORDER BY CreatedDate Desc LIMIT 1",
                this.devHubConfig.scratchOrgAdminUsername
            ).result.records[0].Id;
            forceDataRecordCreate(
                'WebStoreCatalog',
                `ProductCatalogId='${catalogId}' SalesStoreId='${storeId}'`,
                this.devHubConfig.scratchOrgAdminUsername
            );
            // Add Store Pricebook mapping
            const pricebook2Id = forceDataSoql(
                "SELECT Id FROM Pricebook2 WHERE Name='BASIC_PRICEBOOK_FROM_QUICKSTART' ORDER BY CreatedDate Desc LIMIT 1",
                this.devHubConfig.scratchOrgAdminUsername
            ).result.records[0].Id;
            forceDataRecordCreate(
                'WebStorePricebook',
                `IsActive=true Pricebook2Id='${pricebook2Id}' WebStoreId='${storeId}'`,
                this.devHubConfig.scratchOrgAdminUsername
            );
            // Add Buyer Group Pricebook mapping
            const buyergroupId = forceDataSoql(
                `SELECT Id FROM BuyerGroup WHERE Name='${newbuyergroupname}' LIMIT 1`,
                this.devHubConfig.scratchOrgAdminUsername
            ).result.records[0].Id;
            forceDataRecordCreate(
                'BuyerGroupPricebook',
                `Pricebook2Id='${pricebook2Id}' BuyerGroupId='${buyergroupId}'`,
                this.devHubConfig.scratchOrgAdminUsername
            );
        } // Import files
        else
            try {
                shellJsonSfdx(
                    `sfdx force:data:tree:import -u "${this.devHubConfig.scratchOrgAdminUsername}" -p ${JSON_DIR(
                        this.storeDir
                    )}/Plan-1.json`
                );
            } catch (e) {
                if (JSON.stringify(e).indexOf(msgs.getMessage('import.alreadyExists')) < 0) throw e;
                this.ux.log(msgs.getMessage('import.productWithSKUAlreadyExists'));
            }
        const productList = [
            'WebStorePricebooks',
            'WebStoreCatalogs',
            'WebStoreBuyerGroups',
            'BuyerGroups',
            'PricebookEntrys',
        ];
        productList.forEach((file) => fs.removeSync(JSON_DIR(this.storeDir) + `/${file}.json`));
        // Return BuyerGroup Name to be used in BuyerGroup Account mapping
        return newbuyergroupname;
    }
}
