import React, {Fragment, useCallback, useEffect, useState} from 'react';
import './App.css';
import axios from "axios";
import moment from "moment";
import useWebSocket, {ReadyState} from "react-use-websocket";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid, regular, brands } from '@fortawesome/fontawesome-svg-core/import.macro';

//I will move these functions to their own file later on and import them instead

async function authenticate(username) {
    console.log(`authenticating to API with username ${username}`);
    let data = {
        username,
        type: "tic-tac-toe"
    }
    return (await axios.post("http://localhost:3001/authenticate", data));
}

function asyncReducer(state, newState) {
    return newState;
}

function useAsync(asyncFunction) {

    const [state, setState] = React.useReducer(asyncReducer, {
        status: 'pending'
    });
    React.useEffect(() => {

        let promise = asyncFunction();
        if (!promise) return;

        promise.then(newState => {
            setState(newState);
        }).catch(error => {
            console.log(`there was an error getting from useAsync ${JSON.stringify(error)}`);
        })

    }, [asyncFunction])

    return state;
}

function Header({username}) {
    return (
        <div id="header">
            <div id="brand">
                <span className="fs-5">Multiplayer Tic-Tac-Toe</span><br/>
                <span className="fs-10">By Eric Mueller</span>
            </div>
            <div id="account">
                <div className="dropdown" id="user">
                    <button id="user-actions" className="btn btn-secondary dropdown-toggle" type="button" id="logout" data-bs-toggle="dropdown" aria-expanded="false">
                        {username}
                    </button>
                    <ul className="dropdown-menu" aria-labelledby="user-actions">
                        <li><a className="dropdown-item" href="#">Logout</a></li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

function LobbyUsers({gamers}) {
    return (
        <div className="lobby-members">
            <div className="card mb-3">
                <div className="card-body">
                    <div className="d-flex fw-bold small mb-3 card-header">
                        Players in Lobby
                    </div>
                    <div className="ratio ratio-21x9 mb-3">
                        <ul style={{listStyle: 'none', paddingLeft: 0}}>
                            {gamers.map(player => (
                                <li>
                                    <FontAwesomeIcon icon={solid('user-secret')}></FontAwesomeIcon>&nbsp;
                                    {player}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}

function AvailableGames() {
    return (
        <h4>Available Games</h4>
    )
}

function Lobby({username, bearerToken}) {

    const [socketUrl, setSocketUrl] = useState(`ws://localhost:3001/tic-tac-toe/lobby?access_token=${bearerToken}`);
    const [messageHistory, setMessageHistory] = useState([]);
    const {sendMessage, lastMessage, readyState} = useWebSocket(socketUrl);

    useEffect(() => {
        console.log((lastMessage));
        if (lastMessage !== null) {
            setMessageHistory((prev) => prev.concat(lastMessage))
        }
        else {
            sendMessage(JSON.stringify({currentState: 'lobby'}))
        }
    }, [lastMessage, setMessageHistory])

    //websocket connection status
    const connectionStatus = {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Open',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];
    const lobbyUsers = lastMessage ? JSON.parse(lastMessage.data).lobbyUsers : [];

    return (
        <Fragment>
            <div className="game">
                <div className="row">
                    <div className="col-xl-3 col-lg-6">
                        <LobbyUsers gamers={lobbyUsers} />
                    </div>
                    <div className="col-xl-3 col-lg-6">
                        <AvailableGames />
                    </div>
                </div>


            </div>
        </Fragment>
    )

}

function Login({setUsername, username}) {

    const [usernameValidClass, setUsernameValidClass] = React.useState("");
    const usernameField = React.useRef(null);

    function handleEnterLobby(event) {
        event.preventDefault();
        if (usernameField.current.value) {
            setUsername(usernameField.current.value);
            setUsernameValidClass('');
            window.localStorage.setItem("username", usernameField.current.value);
        }
        else {
            setUsernameValidClass("is-invalid")
        }
    }

    function handleUsernameClick(e) {
        if (usernameField.current.className.includes("is-invalid")) {
            setUsernameValidClass("");
        }
    }

    return (
        <div className="container">
            <div className="card text-center mt-lg-5">
                <div className="card-header">
                    Multiplayer Tic-Tac-Toe
                </div>
                <div className="card-body">
                    <h5 className="card-title">
                        Pick a fun username! This is not saved anywhere.
                    </h5>
                    <form className="mt-5 mb-5">
                        <div className="mb-3 row">
                            <label htmlFor="username" className="col-sm-2 col-form-label">Username</label>
                            <div className="col-sm-10">
                                <input type="text" onClick={handleUsernameClick} ref={usernameField} className={`form-control ${usernameValidClass}`} />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" onClick={handleEnterLobby}>Enter Lobby</button>
                    </form>
                </div>
            </div>

        </div>
    )
}


function App() {

    const [username, setUsername] = React.useState(() => {
        return window.localStorage.getItem("username") ? window.localStorage.getItem("username") : "";
    });
    const [authState, setAuthState] = React.useState(() => {
        const authState = window.localStorage.getItem('authState');
        return authState ? authState : '';
    });
    const asyncCallback = React.useCallback(() => {
        if (!username) {
            return;
        }
        return authenticate(username);
    }, [username]);
    const {bearerToken, expiresAt} = authState ? JSON.parse(authState) : '';
    const newAuthState = useAsync(asyncCallback);
    if (newAuthState && newAuthState.status !== 'pending' && newAuthState.data) {
        const {access_token, expiration} = newAuthState.data;
        if (access_token !== bearerToken) {
            const newAuthState = {
                bearerToken: access_token,
                expiration,
                expiresAt: moment().add(expiration, 'minutes')
            }
            setAuthState(JSON.stringify(newAuthState));
            window.localStorage.setItem('authState', JSON.stringify(newAuthState));
        }
    }

    if (!bearerToken || moment().isAfter(expiresAt)) {
        return (
            <div className="App">
                <Login setUsername={setUsername} />
            </div>
        )
    }
    else {
        return (
            <div className="container-fluid">
                <Header username={username} />
                <Lobby username={username} bearerToken={bearerToken}/>
            </div>
        )
    }

}

export default App;
