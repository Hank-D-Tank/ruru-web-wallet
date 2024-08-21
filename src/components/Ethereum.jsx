import { useState } from "react";
import { mnemonicToSeed } from "bip39";
import { Wallet, HDNodeWallet, ethers } from "ethers";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import Modal from "./Modal";
import { RiSendPlaneFill } from "react-icons/ri";

const TESTNET_RPC_URL = "https://sepolia.infura.io/v3/9225ef66020f4bc4ae24e7ec7eab8db2";
const provider = new ethers.JsonRpcProvider(TESTNET_RPC_URL);

/* const ALCHEMY_URL = "https://eth-mainnet.g.alchemy.com/v2/tzUaK--D07MarXAc5HqrjY3uoYKiz6lH";
const provider = new ethers.JsonRpcProvider(ALCHEMY_URL); */

const Ethereum = ({ mnemonic, icon }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [walletInfo, setWalletInfo] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visibleSecretKey, setVisibleSecretKey] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [transferLoading, setTransferLoading] = useState(false);
    const [transferData, setTransferData] = useState({
        walletNo: null,
        recipientAddr: "",
        amount: 0,
    });

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
    };

    const transferETH = async (senderIndex, recipientAddress, amount) => {
        setTransferLoading(true);
        try {
            const senderInfo = walletInfo[senderIndex];
            const wallet = new Wallet(senderInfo.walletSecretKey, provider);
            const transaction = {
                to: recipientAddress,
                value: ethers.parseEther(amount.toString()),
            };

            const txResponse = await wallet.sendTransaction(transaction);
            await txResponse.wait();

            toast.success(`Transaction successful! TxHash: ${txResponse.hash}`, {
                className: "custom-toast",
                bodyClassName: "custom-toast-body",
            });

            const updatedBalance = await provider.getBalance(wallet.address);
            const formattedBalance = ethers.formatEther(updatedBalance);

            setWalletInfo(walletInfo.map((info, index) => 
                index === senderIndex ? { ...info, balance: formattedBalance } : info
            ));
        } catch (error) {
            console.error("Transaction failed", error);
            if(transferData.amount >= walletInfo[transferData.walletNo].balance){
                toast.error("Transaction failed. Insufficient Balance", {
                    className: "custom-toast",
                    bodyClassName: "custom-toast-body",
                });
            }
            else{
                toast.error("Transaction failed. Please try again.", {
                    className: "custom-toast",
                    bodyClassName: "custom-toast-body",
                });
            }
        }
        setTransferLoading(false);
        closeModal();
    };

    const makeTransaction = () => {
        if (transferData.walletNo !== null && transferData.recipientAddr && transferData.amount > 0) {
            transferETH(transferData.walletNo, transferData.recipientAddr, transferData.amount);
        } else {
            toast.error("Please fill in all fields correctly.", {
                className: "custom-toast",
                bodyClassName: "custom-toast-body",
            });
        }
    };

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

    const openModal = (walletNo) => {
        setTransferData({
            walletNo: walletNo,
            recipientAddr: "",
            amount: 0,
        });
        setModalOpen(true);
    };

    const closeModal = () => setModalOpen(false);

    return (
        <>
            <Modal isOpen={modalOpen} closeModal={closeModal}>
                <div className="solana-sending row">
                    <div className="title">Make Transactions.</div>
                    <div className="col-xl-6 col-md-12">
                        <p>Receiver Address</p>
                        <input type="text" placeholder="Receiver's Public Key" className="mt-3" value={transferData.recipientAddr}
                            onChange={(e) => {
                                setTransferData({ ...transferData, recipientAddr: e.target.value })
                            }}
                            onFocus={(e) => {
                                e.target.select();
                            }}
                        />
                    </div>
                    <div className="col-xl-6 col-md-12">
                        <p>Amount</p>
                        <input type="number" placeholder="E.g: 0.05 ETH" className="mt-3" value={transferData.amount}
                            onChange={(e) => {
                                setTransferData({ ...transferData, amount: parseFloat(e.target.value) })
                            }}
                            onFocus={(e) => {
                                e.target.select();
                            }}
                        />
                    </div>
                    <div className="col-12">
                        <button className="btn mt-5" onClick={makeTransaction}>
                            {transferLoading ? <>Transferring... <div className="loader" style={{ borderTopColor: "#fff" }}></div></> : "Hash & Transfer"}
                        </button>
                    </div>
                </div>
            </Modal>
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
                                    <button className="send-icon" onClick={() => openModal(info.walletNo)}>
                                        <RiSendPlaneFill />
                                    </button>
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
        </>
    );
};

export default Ethereum;
