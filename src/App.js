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
