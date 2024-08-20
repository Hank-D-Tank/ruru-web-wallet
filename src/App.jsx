import React, { useState } from "react";
import { generateMnemonic } from "bip39";
import { BsClipboard } from "react-icons/bs";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import sol from "../src/assets/solana.png";
import eth from "../src/assets/ethereum.png";
import Solana from "./components/Solana";
import Ethereum from "./components/Ethereum";
import Modal from "./components/Modal";

function App() {
  const [mnemonic, setMnemonic] = useState("");
  const [loading, setLoading] = useState(false);

  const generateMn = async () => {
    setLoading(true);
    const mn = await generateMnemonic();
    setMnemonic(mn);
    setLoading(false);
  };

  const copyText = () => {
    navigator.clipboard.writeText(mnemonic);
    toast.success("Copied to clipboard successfully!", {
      className: "custom-toast",
      bodyClassName: "custom-toast-body",
    });
  };

  return (
    <div className="container">
      <ToastContainer />
      <div className="heading">RuRu Wallet.</div>
      <div className="content">
        <div className="row">
          <div className="col-lg-12 mb-5">
            <p>
              Personal <span className="highlight">Web-3</span> wallet to
              generate wallets & have fun
            </p>
          </div>
          {/* <div className="col-xl-10 col-lg-9 all-center">
            <div className="input-container me-3">
              <input
                type="password"
                placeholder="Enter Your Secret Phrase / Keep It Empty & Generate New"
              />
            </div>
          </div>
          <div className="col-xl-2 col-lg-3 all-center mt-lg-0 mt-3">
            <button className="btn" onClick={generateMn}>
              Generate Wallet
            </button>
          </div> */}
          <div className="col-xl-12 col-lg-12 all-center mt-lg-0 mt-3">
            <button className="btn btn-classy" onClick={generateMn} data-text={loading ? "Generating..." : "Generate Wallet"}>
              Generate Wallet {loading && "Generating..."}
            </button>
          </div>
          <div className="col-12 mt-5">
            <div className="seed-phrase row">
              <div className="col-lg-3"></div>
              {mnemonic && (
                <div className="col-lg-6 text-center">
                  <h2>Secret Recovery Phrase</h2>
                  <p>Save These Words In A Safe Place.</p>
                  <div className="phrase-container row">
                    {mnemonic.split(" ").map((mn, index) => {
                      return (
                        <div key={index} className="each-word col-3 all-center">
                          <span>{index + 1}</span> {mn}
                        </div>
                      );
                    })}
                    <button className="copy-btn" onClick={copyText}>
                      <BsClipboard />
                    </button>
                  </div>
                </div>
              )}
              <div className="col-lg-3"></div>
            </div>
            {mnemonic && <div className="row mt-5">
              <div className="col-md-6">
                <Solana mnemonic={mnemonic} icon={sol}></Solana>
              </div>
              <div className="col-md-6">
                <Ethereum mnemonic={mnemonic} icon={eth}></Ethereum>
              </div>
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
