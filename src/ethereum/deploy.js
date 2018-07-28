const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const compiledLottery = require('./build/Lottery.json');

const provider = new HDWalletProvider(
  'your mnemonic',
  'https://rinkeby.infura.io/yourtoken'
);
const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();
  console.log('デプロイ中 account:', accounts[0]);
  const result = await new web3.eth.Contract(JSON.parse(compiledLottery.interface))
    .deploy({ data: '0x' + compiledLottery.bytecode })
    .send({ gas: '1000000', from: accounts[0] });

  console.log('デプロイ完了 address:', result.options.address);
};
deploy();
