import './App.css';
import { useNavigate } from 'react-router-dom'
import Modal from 'react-modal';
import React from 'react';

Modal.setAppElement('#root');
const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  },
};
function App() {
  let subtitle;
  const [modalIsOpen, setIsOpen] = React.useState(false);
  let message = "";
  function openModal() {
    setIsOpen(true);
  }

  function afterOpenModal() {
    subtitle.style.color = '#f00';
  }

  function closeModal() {
    setIsOpen(false);
  }

  const nav = useNavigate();
  function mainPage() {
    console.log(message);
    if (message === "") {
      alert("Enter a session ID")
    } else {
      nav("/session", { state: { id: 1, message: message } })
    }
  }

  function createSession() {
    nav("/session", { state: { id: 1 } });
  }
  function changeValue(event) {
    if (event.target.value !== "") {
      message = event.target.value
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        Scrum Poker
        <div>
          <button className='style-button'>Create Session</button>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <button className='style-button' onClick={openModal}>Use Existing Session</button>
        </div>
        <Modal
          isOpen={modalIsOpen}
          onAfterOpen={afterOpenModal}
          onRequestClose={closeModal}
          style={customStyles}
          contentLabel="Example Modal"
        >
          <h2 ref={(_subtitle) => (subtitle = _subtitle)}>Enter Session ID</h2>
          <input onChange={changeValue} />
          <button onClick={mainPage}>Done</button>
          <button onClick={closeModal}>Close</button>
        </Modal>
      </header>
    </div>
  );
}

export default App;
