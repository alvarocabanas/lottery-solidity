const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const { interface, bytecode } = require('./compile');

// This mnemonic is from a test account that will never have real money
const provider = new HDWalletProvider(
  'acoustic glow royal bread erosion guilt lemon lake jelly couch rug chimney',
    'https://rinkeby.infura.io/v3/81ba21ec8cf24c64873d06aba34f383d'
);
const web3 = new Web3(provider);

const deploy = async () => {
    const accounts = await web3.eth.getAccounts();

    console.log('Attempting to deploy from account', accounts[0]);

    const result = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({ data: bytecode})
        .send({ gas: 1000000, from: accounts[0]});

    console.log('Contract deployed to ', result.options.address);
    provider.engine.stop();
};
deploy();