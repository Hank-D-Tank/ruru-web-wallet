import React from 'react';
import { MdOutlineClose } from 'react-icons/md';

const Modal = ({ isOpen, closeModal, children }) => {
  return (
    <div className={isOpen ? "modal" : "modal d-none"} onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="close-modal" onClick={closeModal}>
          <MdOutlineClose />
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
