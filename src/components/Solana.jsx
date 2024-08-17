import { useState } from "react";
import { mnemonicToSeed } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair, Connection } from "@solana/web3.js";
import nacl from "tweetnacl";
import sol from "../assets/solana.png";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const ALCHEMY_URL = "https://solana-mainnet.g.alchemy.com/v2/tzUaK--D07MarXAc5HqrjY3uoYKiz6lH";
const connection = new Connection(ALCHEMY_URL, "confirmed");

const Solana = ({ mnemonic }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [publicKeys, setPublicKeys] = useState([]);
    const [walletInfo, setWalletInfo] = useState([]);
    const [visibleSecretKey, setVisibleSecretKey] = useState(null);

    const createSolanaWallet = async () => {
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
            <button className="wallet-types" onClick={createSolanaWallet}>
                <img src={sol} alt="" className="crypto-logo" />
                Add SOL Wallet
            </button>
            <div className="row">
                <div className="col-md-12">
                    <div className="wallet-info">
                        {walletInfo.map((info, index) => (
                            <div key={index} className="wallet-card">
                                <h3>{info.balance} SOL</h3>
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
    );
}

export default Solana;
