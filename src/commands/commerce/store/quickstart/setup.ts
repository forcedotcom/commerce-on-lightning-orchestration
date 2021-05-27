/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { existsSync } from 'fs';
import { SfdxCommand } from '@salesforce/command';
import { fs, Messages, SfdxError } from '@salesforce/core';
import chalk from 'chalk';
import { AnyJson } from '@salesforce/ts-types';
import { allFlags } from '../../../../lib/flags/commerce/all.flags';
import { addAllowedArgs, filterFlags } from '../../../../lib/utils/args/flagsUtils';
import {
    BASE_DIR,
    BUYER_USER_DEF,
    EXAMPLE_DIR,
    PACKAGE_RETRIEVE,
    PACKAGE_RETRIEVE_TEMPLATE,
    QUICKSTART_CONFIG,
    SCRATCH_ORG_DIR,
    STORE_DIR,
} from '../../../../lib/utils/constants/properties';
import { copyFolderRecursiveSync, mkdirSync, remove } from '../../../../lib/utils/fsUtils';
import {
    BuyerUserDef,
    DevHubConfig,
    Org,
    parseJSONConfigWithFlags,
    StoreConfig,
} from '../../../../lib/utils/jsonUtils';
import { Requires } from '../../../../lib/utils/requires';
import { forceDataRecordCreate, forceDataRecordUpdate, forceDataSoql } from '../../../../lib/utils/sfdx/forceDataSoql';
import { getScratchOrgByUsername } from '../../../../lib/utils/sfdx/forceOrgList';
import { shell, shellJsonSfdx } from '../../../../lib/utils/shell';
import { statusManager, Store } from '../../../../lib/utils/statusFileManager';
import { ProductsImport } from '../../products/import';
import { StoreCreate } from '../create';

Messages.importMessagesDirectory(__dirname);

const TOPIC = 'store';
const CMD = `commerce:${TOPIC}:quickstart:setup`;
const msgs = Messages.loadMessages('commerce', TOPIC);

export class StoreQuickstartSetup extends SfdxCommand {
    public static description = msgs.getMessage('quickstart.setup.cmdDescription');

    public static examples = [`sfdx ${CMD} --configuration devhub-configuration.json`];

    protected static flagsConfig = {
        ...filterFlags(
            ['configuration', 'scratch-org-number', 'scratch-org-admin-username', 'store-name', 'store-number'],
            allFlags
        ),
    };

    private devHubConfig: DevHubConfig;
    private storeDir: string;
    public async run(): Promise<AnyJson> {
        // TODO this is only in store create so makes sense to key off of store
        this.devHubConfig = await parseJSONConfigWithFlags(
            this.flags.configuration,
            StoreQuickstartSetup.flagsConfig,
            this.flags
        );
        await Requires.default(this.devHubConfig.instanceUrl)
            .examplesConverted(
                SCRATCH_ORG_DIR(
                    BASE_DIR,
                    this.devHubConfig.hubOrgAdminUsername,
                    this.devHubConfig.scratchOrgAdminUsername
                ),
                this.flags.configuration,
                this.devHubConfig.storeName
            )
            .build();
        this.storeDir = STORE_DIR(
            BASE_DIR,
            this.devHubConfig.hubOrgAdminUsername,
            this.devHubConfig.scratchOrgAdminUsername,
            this.devHubConfig.storeName
        );
        if (!getScratchOrgByUsername(this.devHubConfig.scratchOrgAdminUsername))
            throw new SfdxError(msgs.getMessage('quickstart.setup.orgCreationNotCompletedSuccesfully'));
        this.devHubConfig['communityNetworkName'] = this.devHubConfig.storeName;
        // If the name of the store starts with a digit, the CustomSite name will have a prepended X.
        this.devHubConfig['communitySiteName'] =
            (/^[0-9]+/.exec(this.devHubConfig.storeName) ? 'X' : '') + this.devHubConfig.storeName;
        // The ExperienceBundle name is similar to the CustomSite name, but has a 1 appended.
        this.devHubConfig['communityExperienceBundleName'] = `${this.devHubConfig.communitySiteName}1`;
        await this.retrievePackages();
        this.ux.log(chalk.green.bold(msgs.getMessage('quickstart.setup.completedQuickstartStep1')));
        await this.setupIntegrations();
        this.ux.log(chalk.green.bold(msgs.getMessage('quickstart.setup.completedQuickstartStep2')));
        await this.updateMemberListActivateCommunity();
        this.ux.log(chalk.green.bold(msgs.getMessage('quickstart.setup.completedQuickstartStep3')));
        await this.importProducts();
        await this.mapAdminUserToRole();
        this.ux.log(chalk.green.bold(msgs.getMessage('quickstart.setup.completedQuickstartStep4')));
        await this.createBuyerUserWithContactAndAccount();
        await this.addContactPointAndDeploy();
        await this.publishCommunity();
        this.ux.log(chalk.green.bold(msgs.getMessage('quickstart.setup.completedQuickstartSetup')));
        return { quickstartSetup: true };
    }

    private async retrievePackages(): Promise<void> {
        if (await statusManager.getValue(this.devHubConfig, new Store(), 'retrievedPackages')) return;
        // Replace the names of the components that will be retrieved. // this should stay as a template so users can modify it to their liking
        const packageRetreive = fs
            .readFileSync(PACKAGE_RETRIEVE_TEMPLATE())
            .toString()
            .replace('YourCommunitySiteNameHere', this.devHubConfig.communitySiteName)
            .replace('YourCommunityExperienceBundleNameHere', this.devHubConfig.communityExperienceBundleName)
            .replace('YourCommunityNetworkNameHere', this.devHubConfig.communityNetworkName);
        fs.writeFileSync(PACKAGE_RETRIEVE(this.storeDir), packageRetreive);
        this.ux.log(msgs.getMessage('quickstart.setup.usingToRetrieveStoreInfo', [packageRetreive]));
        this.ux.log(msgs.getMessage('quickstart.setup.getStoreMetadatFromZip'));
        shell(
            `sfdx force:mdapi:retrieve -u "${this.devHubConfig.scratchOrgAdminUsername}" -r ${
                this.storeDir
            }/experience-bundle-package -k ${PACKAGE_RETRIEVE(this.storeDir)}`
        );
        shell(
            `unzip -d ${this.storeDir}/experience-bundle-package ${this.storeDir}/experience-bundle-package/unpackaged.zip`
        );
        await StoreCreate.waitForStoreId(this.devHubConfig, this.ux);
        await statusManager.setValue(this.devHubConfig, 3, 'retrievedPackages', true);
    }

    private async setupIntegrations(): Promise<void> {
        if (await statusManager.getValue(this.devHubConfig, new Store(), 'integrationSetup')) return;
        this.ux.log(msgs.getMessage('quickstart.setup.setUpIntegrations'));
        await StoreCreate.waitForStoreId(this.devHubConfig, this.ux);
        this.ux.log(msgs.getMessage('quickstart.setup.regAndMapIntegrations'));
        const integrations = [
            ['B2BCheckInventorySample', 'CHECK_INVENTORY', 'Inventory'],
            ['B2BDeliverySample', 'COMPUTE_SHIPPING', 'Shipment'],
            ['B2BTaxSample', 'COMPUTE_TAXES', 'Tax'],
        ];
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        integrations.forEach((args) => this.registerAndMapIntegration(...args));
        this.ux.log(msgs.getMessage('quickstart.setup.doneRegAndMapIntegrations'));

        // By default, use the internal pricing integration
        this.ux.log(msgs.getMessage('quickstart.setup.regAndMapPriceIntegrations'));
        await this.registerAndMapPricingIntegration();
        this.ux.log(msgs.getMessage('quickstart.setup.doneRegAndMapPriceIntegrations'));
        // To use an external integration instead, use the code below:
        // register_and_map_integration "B2BPricingSample" "COMPUTE_PRICE" "Price"
        // Or follow the documentation for setting up the integration manually:
        // https://developer.salesforce.com/docs/atlas.en-us.b2b_comm_lex_dev.meta/b2b_comm_lex_dev/b2b_comm_lex_integration_setup.htm

        this.registerAndMapCreditCardPaymentIntegration();
        this.ux.log(
            msgs.getMessage('quickstart.setup.urlForResOfMappingIntegrations', [
                '/lightning/page/storeDetail?lightning__webStoreId=',
                await statusManager.getValue(this.devHubConfig, new Store(), 'id'),
                '&storeDetail__selectedTab=store_integrations',
            ])
        );
        await statusManager.setValue(this.devHubConfig, 3, 'integrationSetup', true);
    }

    private async registerAndMapIntegration(
        apexClassName?: string,
        developerName?: string,
        serviceProviderType?: string
    ): Promise<void> {
        this.ux.log(
            msgs.getMessage('quickstart.setup.regApexClassForIntegrations', [
                apexClassName,
                developerName,
                serviceProviderType,
            ])
        );
        let apexClassId: string;
        try {
            apexClassId = forceDataSoql(
                `SELECT Id FROM ApexClass WHERE Name='${apexClassName}' LIMIT 1`,
                this.devHubConfig.scratchOrgAdminUsername
            ).result.records[0].Id;
        } catch (e) {
            this.ux.log(
                chalk.red(
                    msgs.getMessage('quickstart.setup.errorRegApexClassForIntegrationsInfo', [
                        apexClassName,
                        'run convert-examples-to-sfdx.sh',
                        'sfdx force:source:push -f',
                    ])
                )
            );
            return;
        }
        forceDataRecordCreate(
            'RegisteredExternalService',
            `DeveloperName=${developerName} ExternalServiceProviderId=${apexClassId} ExternalServiceProviderType=${serviceProviderType} MasterLabel=${developerName}`,
            this.devHubConfig.scratchOrgAdminUsername
        );
        const storeIntegratedServiceId = forceDataSoql(
            `SELECT Id FROM StoreIntegratedService WHERE ServiceProviderType='${serviceProviderType}' AND StoreId='${await statusManager.getValue(
                this.devHubConfig,
                new Store(),
                'id'
            )}' LIMIT 1`,
            this.devHubConfig.scratchOrgAdminUsername
        );
        if (storeIntegratedServiceId.result.totalSize !== 0) {
            this.ux.log(
                msgs.getMessage('quickstart.setup.alreadyMappingInStoreForServiceProviderType', [
                    serviceProviderType,
                    storeIntegratedServiceId.result.records[0].Id,
                ])
            );
            return;
        }
        // No mapping exists, so we will create one
        const registeredExternalServiceId = forceDataSoql(
            `SELECT Id FROM RegisteredExternalService WHERE ExternalServiceProviderId='${apexClassId}' LIMIT 1`,
            this.devHubConfig.scratchOrgAdminUsername
        ).result.records[0].Id;
        forceDataRecordCreate(
            'StoreIntegratedService',
            `Integration=${registeredExternalServiceId} StoreId=${await statusManager.getValue(
                this.devHubConfig,
                new Store(),
                'id'
            )} ServiceProviderType=${serviceProviderType}`,
            this.devHubConfig.scratchOrgAdminUsername
        );
    }

    private async registerAndMapPricingIntegration(): Promise<void> {
        const serviceProviderType = 'Price';
        const integrationName = 'Price__B2B_STOREFRONT__StandardPricing';
        this.ux.log(
            msgs.getMessage('quickstart.setup.registeringInternalPricingForServiceProviderType', [
                integrationName,
                serviceProviderType,
            ])
        );
        const pricingIntegrationId = forceDataSoql(
            `SELECT Id FROM StoreIntegratedService WHERE ServiceProviderType='${serviceProviderType}' AND StoreId='${await statusManager.getValue(
                this.devHubConfig,
                new Store(),
                'id'
            )}' LIMIT 1`,
            this.devHubConfig.scratchOrgAdminUsername
        ).result;
        if (pricingIntegrationId.totalSize > 0) {
            this.ux.log(
                msgs.getMessage('quickstart.setup.existingMappingForPriceServiceProviderType', [
                    pricingIntegrationId.records[0].Id,
                ])
            );
            return;
        }
        forceDataRecordCreate(
            'StoreIntegratedService',
            `Integration=${integrationName} StoreId=${await statusManager.getValue(
                this.devHubConfig,
                new Store(),
                'id'
            )} ServiceProviderType=${serviceProviderType}`,
            this.devHubConfig.scratchOrgAdminUsername
        );
        this.ux.log(msgs.getMessage('quickstart.setup.insToRegExternalPricingIntegration'));
    }

    private registerAndMapCreditCardPaymentIntegration(): void {
        this.ux.log(msgs.getMessage('quickstart.setup.registeringCreditCardPaymentIntegration'));
        // Creating Payment Gateway Provider
        const apexClassId = forceDataSoql(
            "SELECT Id FROM ApexClass WHERE Name='SalesforceAdapter' LIMIT 1",
            this.devHubConfig.scratchOrgAdminUsername
        ).result.records[0].Id;
        this.ux.log(
            msgs.getMessage('quickstart.setup.creatingPaymentGatewayProviderRecordUsingApexAdapterId', [apexClassId])
        );
        forceDataRecordCreate(
            'PaymentGatewayProvider',
            `DeveloperName=SalesforcePGP ApexAdapterId=${apexClassId} MasterLabel=SalesforcePGP IdempotencySupported=Yes Comments=Comments`,
            this.devHubConfig.scratchOrgAdminUsername
        );
        // Creating Payment Gateway
        const paymentGatewayProviderId = forceDataSoql(
            "SELECT Id FROM PaymentGatewayProvider WHERE DeveloperName='SalesforcePGP' LIMIT 1",
            this.devHubConfig.scratchOrgAdminUsername
        ).result.records[0].Id;
        const namedCredentialId = forceDataSoql(
            "SELECT Id FROM NamedCredential WHERE MasterLabel='Salesforce' LIMIT 1",
            this.devHubConfig.scratchOrgAdminUsername
        ).result.records[0].Id;
        this.ux.log(
            msgs.getMessage(
                'quickstart.setup.creatingPaymentGatewayRecordMerchantCredentialIdPaymentGatewayProviderId',
                [namedCredentialId, paymentGatewayProviderId]
            )
        );
        forceDataRecordCreate(
            'PaymentGateway',
            `MerchantCredentialId=${namedCredentialId} PaymentGatewayName=SalesforcePG PaymentGatewayProviderId=${paymentGatewayProviderId} Status=Active`,
            this.devHubConfig.scratchOrgAdminUsername
        );
        // Creating Store Integrated Service
        const storeId = forceDataSoql(
            `SELECT Id FROM WebStore WHERE Name='${this.devHubConfig.communityNetworkName}' LIMIT 1`,
            this.devHubConfig.scratchOrgAdminUsername
        ).result.records[0].Id;
        const paymentGatewayId = forceDataSoql(
            "SELECT Id FROM PaymentGateway WHERE PaymentGatewayName='SalesforcePG' LIMIT 1",
            this.devHubConfig.scratchOrgAdminUsername
        ).result.records[0].Id;
        this.ux.log(
            msgs.getMessage('quickstart.setup.creatingStoreIntegratedServiceWithStorePaymentGatewayId', [
                this.devHubConfig.communityNetworkName,
                paymentGatewayId,
            ])
        );
        forceDataRecordCreate(
            'StoreIntegratedService',
            `Integration=${paymentGatewayId} StoreId=${storeId} ServiceProviderType=Payment`,
            this.devHubConfig.scratchOrgAdminUsername
        );
    }

    private async updateMemberListActivateCommunity(): Promise<void> {
        if (await statusManager.getValue(this.devHubConfig, new Store(), 'memberListUpdatedCommunityActive')) return;
        this.ux.log(msgs.getMessage('quickstart.setup.updatingMembersListActivatingCommunityAndAddingGuestUser'));
        const networkMetaFile = `${this.storeDir}/experience-bundle-package/unpackaged/networks/${this.devHubConfig.communityNetworkName}.network`;
        const data = fs
            .readFileSync(networkMetaFile)
            .toString()
            .replace(
                '<networkMemberGroups>',
                '<networkMemberGroups>\n        <profile>Buyer_User_Profile_From_QuickStart</profile>'
            )
            .replace(/<status>.*/, '<status>Live</status>')
            .replace(/<enableGuestChatter>.*/, '<enableGuestChatter>true</enableGuestChatter>')
            .replace(/<enableGuestFileAccess>.*/, '<enableGuestFileAccess>true</enableGuestFileAccess>')
            .replace(/<selfRegistration>.*/, '<selfRegistration>true</selfRegistration>');
        // .replace('</Network>', '    <selfRegProfile>Buyer_User_Profile_From_QuickStart</selfRegProfile>\n</Network>'); // "Error: You can only select profiles that are associated with the experience."
        fs.writeFileSync(networkMetaFile, data);
        await statusManager.setValue(this.devHubConfig, 3, 'memberListUpdatedCommunityActive', true);
    }

    private updateSelfRegProfile(): void {
        const networkMetaFile = `${this.storeDir}/experience-bundle-package/unpackaged/networks/${this.devHubConfig.communityNetworkName}.network`;
        const data = fs
            .readFileSync(networkMetaFile)
            .toString()
            .replace(
                '</Network>',
                '    <selfRegProfile>Buyer_User_Profile_From_QuickStart</selfRegProfile>\n</Network>'
            );
        fs.writeFileSync(networkMetaFile, data);
        shell(
            `cd ${this.storeDir}/experience-bundle-package/unpackaged && zip -r -X ../${this.devHubConfig.communityExperienceBundleName}ToDeploy.zip ./*`
        );
        shellJsonSfdx(
            `sfdx force:mdapi:deploy -u "${this.devHubConfig.scratchOrgAdminUsername}" -g -f ${this.storeDir}/experience-bundle-package/${this.devHubConfig.communityExperienceBundleName}ToDeploy.zip --wait -1 --verbose --singlepackage`
        );
    }

    private async importProducts(): Promise<void> {
        if (
            (await statusManager.getValue(this.devHubConfig, new Store(), 'productsImported')) === true &&
            (await statusManager.getValue(this.devHubConfig, new Store(), 'buyerGroupName'))
        )
            return;
        const buyerGroupName = (await ProductsImport.run(
            addAllowedArgs(this.argv, ProductsImport),
            this.config
        )) as Record<string, string>;
        if (!buyerGroupName)
            throw new SfdxError(msgs.getMessage('quickstart.setup.errorNoBuyerGroupNameProductImportFailed'));
        await statusManager.setValue(this.devHubConfig, 3, 'productsImported', true);
        await statusManager.setValue(this.devHubConfig, 3, 'buyerGroupName', buyerGroupName['buyerGroupName']);
    }

    private async mapAdminUserToRole(): Promise<void> {
        // TODO find something to verify this is done better than a step
        if (await statusManager.getValue(this.devHubConfig, new Store(), 'adminUserMapped')) return;
        this.ux.log(msgs.getMessage('quickstart.setup.mappingAdminUserToRole'));
        const ceoID = forceDataSoql(
            "SELECT Id FROM UserRole WHERE Name = 'CEO'",
            this.devHubConfig.scratchOrgAdminUsername
        ).result.records[0].Id;
        try {
            forceDataRecordCreate(
                'UserRole',
                `ParentRoleId='${ceoID}' Name='AdminRoleFromQuickstart' DeveloperName='AdminRoleFromQuickstart' RollupDescription='AdminRoleFromQuickstart' `,
                this.devHubConfig.scratchOrgAdminUsername
            );
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            if (e.message.indexOf('DUPLICATE_DEVELOPER_NAME') < 0) throw e;
            this.ux.log(msgs.getMessage('quickstart.setup.thisDeveloperNameAlreadyExists'));
        }
        const newRoleID = forceDataSoql(
            "SELECT Id FROM UserRole WHERE Name = 'AdminRoleFromQuickstart'",
            this.devHubConfig.scratchOrgAdminUsername
        ).result.records[0].Id;
        const username = shellJsonSfdx<Org>(
            `sfdx force:user:display -u "${this.devHubConfig.scratchOrgAdminUsername}" -v "${this.devHubConfig.hubOrgAdminUsername}" --json`
        ).result.username;
        forceDataRecordUpdate(
            'User',
            `UserRoleId='${newRoleID}'`,
            `Username='${username}'`,
            this.devHubConfig.scratchOrgAdminUsername
        );
        await statusManager.setValue(this.devHubConfig, 3, 'adminUserMapped', true);
    }

    private async createBuyerUserWithContactAndAccount(): Promise<void> {
        if (!(await statusManager.getValue(this.devHubConfig, new Store(), 'productsImported')))
            await this.importProducts();
        if (
            (await statusManager.getValue(this.devHubConfig, new Store(), 'accountId')) &&
            (await statusManager.getValue(this.devHubConfig, new Store(), 'buyerUsername'))
        )
            return;
        this.ux.log(msgs.getMessage('quickstart.setup.creatingBuyerUserWithContactAndAccount'));
        try {
            shellJsonSfdx(
                `sfdx force:user:create -u "${this.devHubConfig.scratchOrgAdminUsername}" -f ${BUYER_USER_DEF(
                    this.storeDir
                )} -v "${this.devHubConfig.hubOrgAdminUsername}"`
            );
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            if (err.message.indexOf('DUPLICATES_DETECTED') < 0) throw err;
            this.ux.log('DUPLICATES_DETECTED in force:user:create');
            // if(err) "portal account owner must have a role"  then this.mapAdminUserToRole()
        }
        const buyerUsername = Object.assign(new BuyerUserDef(), await fs.readJson(`${BUYER_USER_DEF(this.storeDir)}`))
            .username;
        this.ux.log(msgs.getMessage('quickstart.setup.makingAccountBuyerAccount'));
        const accountID = forceDataSoql(
            `SELECT Id FROM Account WHERE Name LIKE '${buyerUsername}JITUserAccount' ORDER BY CreatedDate Desc LIMIT 1`,
            this.devHubConfig.scratchOrgAdminUsername
        ).result.records[0].Id;
        forceDataRecordCreate(
            'BuyerAccount',
            `BuyerId='${accountID}' Name='BuyerAccountFromQuickstart' isActive=true`,
            this.devHubConfig.scratchOrgAdminUsername
        );
        this.ux.log(msgs.getMessage('quickstart.setup.assigningBuyerAccountToBuyerGroup'));
        const buyergroupID = forceDataSoql(
            `SELECT Id FROM BuyerGroup WHERE Name='${await statusManager.getValue(
                this.devHubConfig,
                new Store(),
                'buyerGroupName'
            )}'`,
            this.devHubConfig.scratchOrgAdminUsername
        ).result.records[0].Id;
        try {
            forceDataRecordCreate(
                'BuyerGroupMember',
                `BuyerGroupId='${buyergroupID}' BuyerId='${accountID}'`,
                this.devHubConfig.scratchOrgAdminUsername
            );
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            if (e.message.indexOf(msgs.getMessage('quickstart.setup.alreadyBeenAdded')) < 0) throw e;
        }
        await statusManager.setValue(this.devHubConfig, 3, 'accountId', accountID);
        await statusManager.setValue(this.devHubConfig, 3, 'buyerUsername', buyerUsername);
    }

    private async enableGuestBrowsing(): Promise<void> {
        this.ux.log(msgs.getMessage('quickstart.setup.startingGuestBuyerAccessSetup'));
        const scratchOrgDir = SCRATCH_ORG_DIR(
            BASE_DIR,
            this.devHubConfig.hubOrgAdminUsername,
            this.devHubConfig.scratchOrgAdminUsername
        );

        const communityNetworkName = this.devHubConfig.communityNetworkName;
        // To get the name of the config file, take community name and ensure first letter is lowercase.
        const configName = communityNetworkName.charAt(0).toLowerCase() + communityNetworkName.slice(1);
        const tmpDirName = this.storeDir + '/sourceGuestProfile';
        // Can only force:source:deploy from sfdx project folder
        // Cannot push source Guest Profile earlier as Store is not created yet
        let pathToGuestProfile = EXAMPLE_DIR() + '/users/guest-user-profile-setup';
        copyFolderRecursiveSync(pathToGuestProfile, this.storeDir);
        pathToGuestProfile = this.storeDir + '/guest-user-profile-setup';
        // Guest Profile has a space in the name. Do not be alarmed.
        const srcGuestProfile = `${pathToGuestProfile}/profiles/InsertStoreNameHere Profile.profile`;
        const trgtGuestProfile = `${pathToGuestProfile}/profiles/${communityNetworkName} Profile.profile`;
        fs.renameSync(srcGuestProfile, trgtGuestProfile);
        shell(`cd ${scratchOrgDir} && sfdx force:mdapi:convert -r ${pathToGuestProfile} -d ${tmpDirName}`);
        shell(
            `cd ${scratchOrgDir} && sfdx force:source:deploy -p ${tmpDirName} -u ${this.devHubConfig.scratchOrgAdminUsername}`
        );

        // Sharing Rules
        const sharingRulesDirOrg = QUICKSTART_CONFIG() + '/guestbrowsing/sharingRules';
        const productCatalogShareTemplate = `${sharingRulesDirOrg}/ProductCatalog-template.sharingRules`;
        const sharingRulesDir = this.storeDir + '/experience-bundle-package/unpackaged/sharingRules';
        mkdirSync(sharingRulesDir);
        const actualProductCatalogShare = sharingRulesDir + '/ProductCatalog.sharingRules';
        fs.writeFileSync(
            actualProductCatalogShare,
            fs
                .readFileSync(productCatalogShareTemplate)
                .toString()
                .replace(/YourStoreName/g, this.devHubConfig.communitySiteName)
        );

        this.ux.log(msgs.getMessage('quickstart.setup.makeSiteAndNavMenuItemPublic'));
        const siteConfigMetaFileName =
            this.storeDir +
            `/experience-bundle-package/unpackaged/experiences/${this.devHubConfig.communityExperienceBundleName}/config/${configName}.json`;
        const siteConfigMetaFile = Object.assign(new StoreConfig(), await fs.readJson(siteConfigMetaFileName));
        siteConfigMetaFile.isAvailableToGuests = true;
        siteConfigMetaFile.authenticationType = 'AUTHENTICATED_WITH_PUBLIC_ACCESS_ENABLED';
        fs.writeFileSync(siteConfigMetaFileName, JSON.stringify(siteConfigMetaFile, null, 4));
        const siteConfigMainAppPageFileName =
            this.storeDir +
            `/experience-bundle-package/unpackaged/experiences/${this.devHubConfig.communityExperienceBundleName}/config/mainAppPage.json`;
        fs.writeFileSync(
            siteConfigMainAppPageFileName,
            fs
                .readFileSync(siteConfigMainAppPageFileName)
                .toString()
                .replace('"isRelaxedCSPLevel" : false,', '"isRelaxedCSPLevel" : true,')
        );
        const navMenuItemMetaFile =
            this.storeDir + '/experience-bundle-package/unpackaged/navigationMenus/Default_Navigation.navigationMenu';
        fs.writeFileSync(
            navMenuItemMetaFile,
            fs
                .readFileSync(navMenuItemMetaFile)
                .toString()
                .replace('<publiclyAvailable>false', '<publiclyAvailable>true')
        );

        this.ux.log(msgs.getMessage('quickstart.setup.enableGuestBrowsingForWebStoreAndCreateGuestBuyerProfile'));
        // Assign to Buyer Group of choice.
        forceDataRecordUpdate(
            'WebStore',
            "OptionsGuestBrowsingEnabled='true'",
            `Name='${communityNetworkName}'`,
            this.devHubConfig.scratchOrgAdminUsername
        );
        let guestBuyerProfileId: string;
        try {
            guestBuyerProfileId = forceDataSoql(
                `SELECT GuestBuyerProfileId FROM WebStore WHERE Name = '${communityNetworkName}'`,
                this.devHubConfig.scratchOrgAdminUsername
            ).result.records[0]['GuestBuyerProfileId'] as string;
        } catch (e) {
            this.ux.log(
                chalk.red(
                    msgs.getMessage(
                        'quickstart.setup.errorGettingGuestBuyerProfileIdOfWebStoreForEnableGuestBrowsing',
                        [communityNetworkName]
                    )
                )
            );
            throw e;
        }
        const buyergroupID = forceDataSoql(
            `SELECT Id FROM BuyerGroup WHERE Name='${await statusManager.getValue(
                this.devHubConfig,
                new Store(),
                'buyerGroupName'
            )}'`,
            this.devHubConfig.scratchOrgAdminUsername
        ).result.records[0].Id;
        try {
            forceDataRecordCreate(
                'BuyerGroupMember',
                `BuyerGroupId='${buyergroupID}' BuyerId='${guestBuyerProfileId}'`,
                this.devHubConfig.scratchOrgAdminUsername
            );
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            if (e.message.indexOf(msgs.getMessage('quickstart.setup.alreadyBeenAdded')) < 0) throw e;
        }
        this.ux.log(msgs.getMessage('quickstart.setup.doneGuestBuyerAccessSetup'));
    }

    private async addContactPointAndDeploy(): Promise<void> {
        let accountId = (await statusManager.getValue(this.devHubConfig, new Store(), 'accountId')) as string;
        if (!accountId) await this.createBuyerUserWithContactAndAccount();
        accountId = (await statusManager.getValue(this.devHubConfig, new Store(), 'accountId')) as string;
        // Add Contact Point Addresses to the buyer account associated with the buyer user.
        // The account will have 2 Shipping and 2 billing addresses associated to it.
        // To view the addresses in the UI you need to add Contact Point Addresses to the related lists for Account
        this.ux.log(msgs.getMessage('quickstart.setup.addContactPointAddressesToBuyerAccount'));
        const existingCPAForBuyerAccount = forceDataSoql(
            `SELECT Id FROM ContactPointAddress WHERE ParentId='${accountId}' LIMIT 1`,
            this.devHubConfig.scratchOrgAdminUsername
        ).result;
        if (existingCPAForBuyerAccount.totalSize === 0)
            [
                "AddressType='Shipping' ParentId='$accountID' ActiveFromDate='2020-01-01' ActiveToDate='2040-01-01' City='San Francisco' Country='US' IsDefault='true' Name='Default Shipping' PostalCode='94105' State='CA' Street='415 Mission Street (Shipping)'",
                "AddressType='Billing' ParentId='$accountID' ActiveFromDate='2020-01-01' ActiveToDate='2040-01-01' City='San Francisco' Country='US' IsDefault='true' Name='Default Billing' PostalCode='94105' State='CA' Street='415 Mission Street (Billing)'",
                "AddressType='Shipping' ParentId='$accountID' ActiveFromDate='2020-01-01' ActiveToDate='2040-01-01' City='Burlington' Country='US' IsDefault='false' Name='Non-Default Shipping' PostalCode='01803' State='MA' Street='5 Wall St (Shipping)'",
                "AddressType='Billing' ParentId='$accountID' ActiveFromDate='2020-01-01' ActiveToDate='2040-01-01' City='Burlington' Country='US' IsDefault='false' Name='Non-Default Billing' PostalCode='01803' State='MA' Street='5 Wall St (Billing)'",
            ].forEach((v) =>
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                forceDataRecordCreate(
                    'ContactPointAddress',
                    v.replace('$accountID', accountId),
                    this.devHubConfig.scratchOrgAdminUsername
                )
            );
        else
            this.ux.log(
                msgs.getMessage('quickstart.setup.already1OrMoreContactPointAddressForBuyerAccount', [
                    await statusManager.getValue(this.devHubConfig, new Store(), 'buyerUsername'),
                ])
            );

        this.ux.log(msgs.getMessage('quickstart.setup.settingUpGuestBrowsing'));
        this.ux.log(msgs.getMessage('quickstart.setup.checkingB2BorB2C'));
        const storeTypeRes = forceDataSoql(
            `SELECT Type FROM WebStore WHERE Name = '${this.devHubConfig.storeName}'`,
            this.devHubConfig.scratchOrgAdminUsername
        );
        if (
            !storeTypeRes.result ||
            !storeTypeRes.result.records ||
            storeTypeRes.result.records.length === 0 ||
            !storeTypeRes.result.records[0]['Type']
        )
            throw new SfdxError(msgs.getMessage('quickstart.setup.storeTypeDoesNotExist'));
        const storeType = storeTypeRes.result.records[0]['Type'] as string;
        this.ux.log('Store Type = ' + JSON.stringify(storeType));
        // Update Guest Profile with required CRUD and FLS
        if ('B2C' === storeType) await this.enableGuestBrowsing();

        // Deploy Updated Store
        this.ux.log(msgs.getMessage('quickstart.setup.creatingPackageToDeployWithNewFlow'));
        if (!existsSync(`${this.storeDir}/experience-bundle-package/unpackaged/`))
            throw new SfdxError(
                'Something went wrong no experience bundle ' + `${this.storeDir}/experience-bundle-package/unpackaged/`
            );
        fs.copyFileSync(
            `${QUICKSTART_CONFIG()}/package-deploy-template.xml`,
            `${this.storeDir}/experience-bundle-package/unpackaged/package.xml`
        );
        shell(
            `cd ${this.storeDir}/experience-bundle-package/unpackaged && zip -r -X ../${this.devHubConfig.communityExperienceBundleName}ToDeploy.zip ./*`
        );
        this.ux.log(msgs.getMessage('quickstart.setup.deployNewZipWithFlowIgnoringWarningsCleanUp'));
        let res;
        try {
            res = shellJsonSfdx(
                `sfdx force:mdapi:deploy -u "${this.devHubConfig.scratchOrgAdminUsername}" -g -f ${this.storeDir}/experience-bundle-package/${this.devHubConfig.communityExperienceBundleName}ToDeploy.zip --wait -1 --verbose --singlepackage`
            );
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (JSON.stringify(e.message).indexOf(msgs.getMessage('quickstart.setup.checkInvalidSession')) >= 0) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                this.ux.log(msgs.getMessage('quickstart.setup.openingPageToRefreshSession', [e.message]));
                shell('sfdx force:org:open -u ' + this.devHubConfig.scratchOrgAdminUsername);
                res = shellJsonSfdx(
                    `sfdx force:mdapi:deploy -u "${this.devHubConfig.scratchOrgAdminUsername}" -g -f ${this.storeDir}/experience-bundle-package/${this.devHubConfig.communityExperienceBundleName}ToDeploy.zip --wait -1 --verbose --singlepackage`
                );
            } else throw e;
        }
        // Need to add here because: Error happens if done above, "Error: You can only select profiles that are associated with the experience."
        this.updateSelfRegProfile();
        this.ux.log(JSON.stringify(res));
        this.ux.log(msgs.getMessage('quickstart.setup.removingXmlFilesPackageForRetrievingAndDeployingMetadata'));
        const removeFiles = ['package-retrieve.xml', 'experience-bundle-package'];
        removeFiles.forEach((f) => remove(this.storeDir + '/' + f));
    }

    private async publishCommunity(): Promise<void> {
        if (await statusManager.getValue(this.devHubConfig, new Store(), 'communityPublished')) return;
        this.ux.log(msgs.getMessage('quickstart.setup.publishingCommunityStep7'));
        shell(
            `sfdx force:community:publish -u "${this.devHubConfig.scratchOrgAdminUsername}" -n "${this.devHubConfig.communityNetworkName}"`
        );
        // TODO check if the publish is done before moving on
        await statusManager.setValue(this.devHubConfig, 3, 'communityPublished', true);
    }
}
