## 環境

下記環境での動作確認ができています。

環境を合わせるようにしてください。

- node v8.7.0
- npm 6.0.0

## 準備
- [metamask](https://goo.gl/2NjkmW)のインストール
- [Infura](https://infura.io/)の登録

## インストール

```
$ git clone https://github.com/tailup0/lottery-dapps.git
$ cd lottery-dapps
$ npm install
```

## 開発環境構築手順 ご参考

構築手順はあくまで参考です。

基本的に上記環境であれば構築手順は問いません。

### 1. nodebrew インストール

https://github.com/hokaccha/nodebrew

macの場合、homebrew経由でもインストール可能です。

### 2. node v8.7.0 インストール

```
$ nodebrew install-binary v8.7.0
$ nodebrew use v8.7.0
```

### 3. npm 6.0.0 インストール

```
$ npm install -g npm@6.0.0
```

## 開発手順

### 1 [metamask](https://goo.gl/2NjkmW)をブラウザにインストールし、フレーズ(ニーモニック) を保存
フレーズはあとで使います。

### 2 [Infura](https://infura.io/)を登録し、APIキーを保存
APIキーはあとで使います。

### 3 下記のファイル及びフォルダをプロジェクト内に作成します。
- src/ethereum
- src/ethereum/build/
- src/ethereum/contracts/
- src/ethereum/contracts/Lottery.sol
- src/ethereum/lottery.js
- src/ethereum/deploy.js
- src/ethereum/web3.js
- src/ethereum/compile.js

### 4 Lottery.sol
```
pragma solidity ^0.4.17;

contract Lottery {
    address public manager;
    address public preWinner;
    address[] public players;

    constructor() public {
        manager = msg.sender;
    }

    function enter() public payable {
        require(msg.value > .01 ether);

        players.push(msg.sender);
    }

    function random() private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.difficulty, now, players)));
    }

    function pickWinner() public restricted {
        uint index = random() % players.length;
        preWinner = address(players[index]);
        players[index].transfer(address(this).balance);
        players = new address[](0);
    }

    modifier restricted() {
        require(msg.sender == manager);
        _;
    }

    function getPlayers() public view returns (address[]) {
        return players;
    }
}
```

### 5 compile.js
```
const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');

const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);

const campaignPath = path.resolve(__dirname, 'contracts', 'Lottery.sol');
const source = fs.readFileSync(campaignPath, 'utf8');
const output = solc.compile(source, 1).contracts;

fs.ensureDirSync(buildPath);

for (let contract in output) {
    fs.outputJsonSync(
        path.resolve(buildPath, contract.replace(':', '') + '.json'),
        output[contract]
    );
}
```

### 6 Solidity のコンパイル実行
下記コマンド実行後、ethereum/build/配下にjsonファイルができていることを確認する

```
$ node src/ethereum/compile.js
```

### 7 deploy.js
```
const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const compiledLottery = require('./build/Lottery.json');

const provider = new HDWalletProvider(
  '1で保存しておいたフレーズ',
  'https://rinkeby.infura.io/2で保存しておいたAPIキー'
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
```

### 8 デプロイ実行
デプロイ実行時に表示されるコントラクトアドレスを保存
```
$ node src/ethereum/deploy.js
```

### 9 lottery.js
```
import web3 from './web3';
import Lottery from './build/Lottery.json';

const instance = new web3.eth.Contract(
    JSON.parse(Lottery.interface),
    '8で保存しておいたコントラクトアドレス'
);

export default instance;
```

### 10 web3.js
```
import Web3 from 'web3';

const web3 = new Web3(window.web3.currentProvider);

export default web3;
```

### 11 App.js
```
import React, { Component } from 'react';
import lottery from './ethereum/lottery';
import web3 from './ethereum/web3';
import './App.css';

class App extends Component {

  state = {
    manager: '',
    players: [],
    preWinner: '',
    balance: '',
    value: '',
    message: ''
  };

  async componentDidMount() {
    this.setContractState();
  }

  setContractState = async event => {
    const manager = await lottery.methods.manager().call();
    const players = await lottery.methods.getPlayers().call();
    const preWinner = await lottery.methods.preWinner().call();
    const balance = await web3.eth.getBalance(lottery.options.address);

    this.setState({ manager, players, preWinner, balance });
  };

  onSubmit = async event => {
    event.preventDefault();

    const accounts = await web3.eth.getAccounts();

    this.setState({ message: '送金中' });

    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei(this.state.value, 'ether'),
      gas: '1000000'
    });

    this.setState({ message: '送金完了' });
    this.setContractState();
  };

  onClick = async () => {
    const accounts = await web3.eth.getAccounts();

    this.setState({ message: '当選者選択中' });

    await lottery.methods.pickWinner().send({
      from: accounts[0],
      gas: '1000000'
    });

    this.setState({ message: '当選者選択完了' });
    this.setContractState();
  };

  render() {
    return (
      <div className="App">
        <h1>宝くじ Dapps</h1>
        <p> 管理者アドレス {this.state.manager} </p>
        <p> 現在の参加者 {this.state.players.length} 人 </p>
        <p> 獲得賞金 {web3.utils.fromWei(this.state.balance, 'ether')} ether! </p>
        <p> 前回当選者 {this.state.preWinner} </p>
        <p style={{color: "red"}}> {this.state.message} </p>
        <hr />

        <form onSubmit={this.onSubmit}>
          <div>
            <label>ether</label>
            <input
              value={this.state.value}
              onChange={event => this.setState({ value: event.target.value })}
            />
          </div>
          <button>入金</button>
        </form>

        <hr />

        <h4>当選者を選択</h4>
        <button onClick={this.onClick}>当選者を選択</button>
      </div>
    );
  }
}

export default App;
```

### 12 アプリ実行
```
$ npm run start
```
