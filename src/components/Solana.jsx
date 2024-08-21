import { useState } from "react";
import { mnemonicToSeed } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair, Connection, sendAndConfirmTransaction, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { RiSendPlaneFill } from "react-icons/ri";
import Modal from "./Modal";

/* const ALCHEMY_URL = "https://solana-mainnet.g.alchemy.com/v2/tzUaK--D07MarXAc5HqrjY3uoYKiz6lH";
const connection = new Connection(ALCHEMY_URL, "confirmed"); */

const DEVNET_URL = "https://api.devnet.solana.com";
const connection = new Connection(DEVNET_URL, "confirmed");


const Solana = ({ mnemonic, icon }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [publicKeys, setPublicKeys] = useState([]);
    const [walletInfo, setWalletInfo] = useState([]);
    const [loading, setLoading] = useState(false);
    const [visibleSecretKey, setVisibleSecretKey] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [transferLoading, setTransferLoading] = useState(false);
    const [transferData, setTransferData] = useState({
        walletNo: null,
        recepientAddr: "",
        amount: 0,
    });

    const createSolanaWallet = async () => {
        setLoading(true);
        const seed = mnemonicToSeed(mnemonic);
        const path = `m/44'/501'/${currentIndex}'/0'`;
        const derivedSeed = derivePath(path, seed.toString("hex")).key;
        const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
        const keypair = Keypair.fromSecretKey(secret);
        const walletPublicKey = keypair.publicKey;
        const walletInfoObj = {
            walletNo: currentIndex,
            walletPublicKey,
            walletSecretKey: keypair.secretKey,
            walletDerivedSeed: derivedSeed,
            walletMainSeed: seed,
            balance: 0
        };

        const balance = await connection.getBalance(walletPublicKey);
        walletInfoObj.balance = balance / 1e9;

        setCurrentIndex(currentIndex + 1);
        setPublicKeys([...publicKeys, walletPublicKey]);
        setWalletInfo([...walletInfo, walletInfoObj]);
        setLoading(false);
    }

    const transferSOL = async (senderIndex, recipientPublicKey, amount) => {
        setTransferLoading(true);
        try {
            const senderInfo = walletInfo[senderIndex];
            const senderKeypair = Keypair.fromSecretKey(senderInfo.walletSecretKey);
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: senderKeypair.publicKey,
                    toPubkey: new PublicKey(recipientPublicKey),
                    lamports: amount * 1e9,
                })
            );

            transaction.feePayer = senderKeypair.publicKey;
            transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            await transaction.sign(senderKeypair);

            const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);

            toast.success(`Transaction successful! Signature!`, {
                className: "custom-toast",
                bodyClassName: "custom-toast-body",
            });

            const updatedSenderBalance = await connection.getBalance(senderKeypair.publicKey);
            const updatedWalletInfo = walletInfo.map((info, index) => {
                if (index === senderIndex) {
                    return { ...info, balance: updatedSenderBalance / 1e9 };
                }
                if (info.walletPublicKey.toBase58() === recipientPublicKey) {
                    const updatedRecipientBalance = info.balance + amount;
                    return { ...info, balance: updatedRecipientBalance };
                }
                return info;
            });

            setWalletInfo(updatedWalletInfo);
            setTransferLoading(false);

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
            setTransferLoading(false);
        }
    };


    const makeTransaction = () => {
        console.log(transferData);
        if (transferData.walletNo !== null && transferData.recepientAddr && transferData.amount > 0) {
            transferSOL(transferData.walletNo, transferData.recepientAddr, transferData.amount);
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
            recepientAddr: "",
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
                        <input type="text" placeholder="Receiver's Public Key" className="mt-3" value={transferData.recepientAddr}
                            onChange={(e) => {
                                setTransferData({ ...transferData, recepientAddr: e.target.value })
                            }}
                            onFocus={(e) => {
                                e.target.select();
                            }}
                        />
                    </div>
                    <div className="col-xl-6 col-md-12">
                        <p>Amount</p>
                        <input type="number" placeholder="E.g: 0.05 SOL" className="mt-3" value={transferData.amount}
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
                            {transferLoading ? <>Transferring... <div className="loader" style={{borderTopColor: "#fff"}}></div></> : "Sign & Transfer"}
                        </button>
                    </div>
                </div>
            </Modal>
            <div className="wallet-container all-center">
                <button className="wallet-types" onClick={createSolanaWallet}>
                    <img src={icon} alt="" className="crypto-logo" />
                    {loading ? <>Adding SOL Wallet <div className="loader"></div></> : <>Add SOL Wallet</>}
                </button>
                <div className="row">
                    <div className="col-md-12">
                        <div className="wallet-info">
                            {walletInfo.map((info, index) => (
                                <div key={index} className="wallet-card">
                                    <h3>{info.balance} SOL</h3>
                                    <button className="send-icon" onClick={() => { openModal(walletInfo[index].walletNo) }}>
                                        <RiSendPlaneFill />
                                    </button>
                                    <div className="wallet-field">
                                        <span>Public Key</span>
                                        <div className="input-container">
                                            <input
                                                type="text"
                                                value={info.walletPublicKey.toBase58()}
                                                readOnly
                                                onClick={() => copyToClipboard(info.walletPublicKey.toBase58())}
                                            />
                                        </div>
                                    </div>
                                    <div className="wallet-field">
                                        <span>Secret Key</span>
                                        <div className="secret-key-container input-container">
                                            <input
                                                type={visibleSecretKey === index ? "text" : "password"}
                                                value={Buffer.from(info.walletSecretKey).toString('hex')}
                                                readOnly
                                                onClick={() => copyToClipboard(Buffer.from(info.walletSecretKey).toString('hex'))}
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
}

export default Solana;
