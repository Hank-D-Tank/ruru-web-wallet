import { useState } from "react";
import { mnemonicToSeed } from "bip39";
import { Wallet, HDNodeWallet, ethers } from "ethers";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ALCHEMY_URL = "https://eth-mainnet.g.alchemy.com/v2/tzUaK--D07MarXAc5HqrjY3uoYKiz6lH";
const provider = new ethers.JsonRpcProvider(ALCHEMY_URL);

const Ethereum = ({ mnemonic, icon }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [walletInfo, setWalletInfo] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visibleSecretKey, setVisibleSecretKey] = useState(null);

    const createEthereumWallet = async () => {
        setLoading(true);
        const seed = await mnemonicToSeed(mnemonic);
        const derivationPath = `m/44'/60'/${currentIndex}'/0'`;
        const hdNode = HDNodeWallet.fromSeed(seed);
        const child = hdNode.derivePath(derivationPath);
        const privateKey = child.privateKey;
        const wallet = new Wallet(privateKey);
        const walletAddress = wallet.address;

        const balance = await provider.getBalance(walletAddress);
        const formattedBalance = ethers.formatEther(balance);

        const walletInfoObj = {
            walletNo: currentIndex,
            walletAddress,
            walletSecretKey: privateKey,
            balance: formattedBalance
        };

        setCurrentIndex(currentIndex + 1);
        setWalletInfo([...walletInfo, walletInfoObj]);
        setLoading(false);
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard successfully!", {
            className: "custom-toast",
            bodyClassName: "custom-toast-body",
        });
    };

    const toggleSecretKeyVisibility = (index) => {
        setVisibleSecretKey(visibleSecretKey === index ? null : index);
    };

    return (
        <div className="wallet-container all-center">
            <button className="wallet-types" onClick={createEthereumWallet}>
                <img src={icon} alt="" className="crypto-logo" />
                 {loading ? <>Adding Eth Wallet <div className="loader"></div></> : <>Add Eth Wallet</>}
            </button>
            <div className="row">
                <div className="col-md-12">
                    <div className="wallet-info">
                        {walletInfo.map((info, index) => (
                            <div key={index} className="wallet-card">
                                <h3>{info.balance} ETH</h3>
                                <div className="wallet-field">
                                    <span>Public Key</span>
                                    <div className="input-container">
                                    <input
                                        type="text"
                                        value={info.walletAddress}
                                        readOnly
                                        onClick={() => copyToClipboard(info.walletAddress)}
                                    />
                                    </div>
                                </div>
                                <div className="wallet-field">
                                    <span>Secret Key</span>
                                    <div className="secret-key-container input-container">
                                        <input
                                            type={visibleSecretKey === index ? "text" : "password"}
                                            value={info.walletSecretKey}
                                            readOnly
                                            onClick={() => copyToClipboard(info.walletSecretKey)}
                                        />
                                        {visibleSecretKey === index ? (
                                            <AiOutlineEyeInvisible onClick={() => toggleSecretKeyVisibility(index)} />
                                        ) : (
                                            <AiOutlineEye onClick={() => toggleSecretKeyVisibility(index)} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Ethereum;
