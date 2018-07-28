import web3 from './web3';
import Lottery from './build/Lottery.json';

const instance = new web3.eth.Contract(
    JSON.parse(Lottery.interface),
    '0x your contract address'
);

export default instance;
