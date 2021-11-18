const { Account } = require("@tonclient/appkit");
const { TonClient, signerKeys } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
const execSync = require('child_process').execSync;
const path = require("path");
const fs = require('fs');
const ContractName = 'Contract';


TonClient.useBinaryLibrary(libNode)

async function main(client) {
    const solFile = fs.readFileSync(ContractName + '.sol', 'utf-8');

    execSync('tondev sol compile ' + ContractName + '.sol');

    const tvc_string = fs.readFileSync(ContractName + ".tvc", {encoding: 'base64'});

    const abi = await JSON.parse(fs.readFileSync(ContractName + '.abi.json'));

    const AccContract = {
        abi: abi,
        tvc: tvc_string,
    };

    const keys = await TonClient.default.crypto.generate_random_sign_keys();

    const ContractAcc = new Account(AccContract, {
        signer: signerKeys(keys),
        client,
    });

    const address = await ContractAcc.getAddress();
    console.log(`Future address of the contract will be: ${address}`);

    await ContractAcc.deploy({ useGiver: true });
    console.log(`Contract was deployed at address: ${address}`);

    const dabi = Buffer.from(JSON.stringify(abi)).toString('base64');
    console.log(`dabi: ${dabi}`)

    const decodedFile = execSync('tonos-cli decode stateinit ' + ContractName + '.tvc --tvc');
    fs.writeFileSync(ContractName +'.decoded.json', decodedFile);
    fs.writeFileSync(ContractName +'.decoded.json', execSync("sed '1,4d' " + ContractName +'.decoded.json'));

    const decoded = await JSON.parse(fs.readFileSync(ContractName + '.decoded.json'));
    let code = decoded.code
    console.log(`code: ${code}`)

}

(async () => {
    const client = new TonClient({
        network: {
            endpoints: ["http://localhost"]
        }
    });
    try {
        console.log("Hello localhost TON!");
        await main(client);
        process.exit(0);
    } catch (error) {
        if (error.code === 504) {
            console.error(`Network is inaccessible.`);
        } else {
            console.error(error);
        }
    }
    client.close();
})();