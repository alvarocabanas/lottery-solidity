const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider())
const { interface, bytecode } = require('../compile')

let accounts;
let lottery;
let gas = 1000000

beforeEach(async () => {
    // Get a list of all accounts
    accounts = await web3.eth.getAccounts();

    // Use one of those accounts to deploy the contract
    lottery = await new web3.eth.Contract(JSON.parse(interface))
        .deploy({ data: bytecode })
        .send({ from: accounts[0], gas: gas })
});

describe('Lottery Contract', () => {
    it('deploys a contract', () => {
        assert.ok(lottery.options.address);
    });

    it('it allows one account to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: Web3.utils.toWei('0.02', 'ether'),
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0],
        });

        assert.equal(accounts[0], players[0])
        assert.equal(1, players.length)
    })

    it('it allows multiple account to enter', async () => {
        await lottery.methods.enter().send({
            from: accounts[0],
            value: Web3.utils.toWei('0.02', 'ether'),
        });

        await lottery.methods.enter().send({
            from: accounts[1],
            value: Web3.utils.toWei('0.02', 'ether'),
        });

        await lottery.methods.enter().send({
            from: accounts[2],
            value: Web3.utils.toWei('0.02', 'ether'),
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[0],
        });

        assert.equal(accounts[0], players[0])
        assert.equal(accounts[1], players[1])
        assert.equal(accounts[2], players[2])
        assert.equal(3, players.length)
    })

    it('it requires a minimum amount of ether to enter', async () => {
        try {
            await lottery.methods.enter().send({
                from: accounts[0],
                value: Web3.utils.toWei('0.001', 'ether'),
            });
            assert(false)
        } catch(err) {
            assert(err)
        }
    })

    it('it requires the manager to pick a winner', async () => {
        try {
            await lottery.methods.pickWinner().send({
                from: accounts[1],
            });
            assert(false)
        } catch(err) {
            assert(err)
        }
    })

    it('it sends money to the winner and resets players', async () => {
        const initialBalance = await web3.eth.getBalance(accounts[1])
        await lottery.methods.enter().send({
            from: accounts[1],
            value: Web3.utils.toWei('0.02', 'ether'),
        });

        let players = await lottery.methods.getPlayers().call({
            from: accounts[0],
        });

        assert.equal(1, players.length)

        await lottery.methods.enter().send({
            from: accounts[1],
            value: Web3.utils.toWei('0.02', 'ether'),
        });

        await lottery.methods.enter().send({
            from: accounts[1],
            value: Web3.utils.toWei('0.02', 'ether'),
        });

        const newBalance = await web3.eth.getBalance(accounts[1])
        const difference = initialBalance - newBalance;

        // We compare with a bit more for the gas
        assert(difference > web3.utils.toWei('0.06') && difference < web3.utils.toWei('0.061'));

        let lotteryBalance = await web3.eth.getBalance(lottery.options.address);
        assert.equal(web3.utils.toWei('0.06'), lotteryBalance);

        await lottery.methods.pickWinner().send({
            from: accounts[0],
        });

        const finalBalance = await web3.eth.getBalance(accounts[1])
        const finalDifference = initialBalance - finalBalance;

        // We have returned the money except the gas
        assert(finalDifference < web3.utils.toWei('0.001'));

        players = await lottery.methods.getPlayers().call({
            from: accounts[0],
        });
        assert.equal(0, players.length);

        lotteryBalance = await web3.eth.getBalance(lottery.options.address);
        assert.equal(0, lotteryBalance);

    })
})