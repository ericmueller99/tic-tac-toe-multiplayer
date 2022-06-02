import React, {useRef} from 'react';
import './App.css';
import axios from "axios";

function Lobby() {

}

function Login({setBearerToken, bearerToken}) {

    const [username, setUsername] = React.useState('');
    const [fetchingBearer, setFetchingBearer] = React.useState(false);
    const usernameField = useRef(null);

    React.useEffect(() => {

        //if there is no username then just return
        if (!username || fetchingBearer || bearerToken) {
            return;
        }

        let data = {
            username,
            type: "tic-tac-toe"
        }

        setFetchingBearer(true)

        console.log('getting bearer');

        axios
            .post("http://localhost:3001/authenticate", data)
            .then(res => {

                setFetchingBearer(false);

                if (res?.data.result) {
                    const {access_token: bearerToken} = res.data;
                    setBearerToken(bearerToken);
                    window.localStorage.setItem("bearerToken", bearerToken);
                }
                else {

                }
            })
            .catch(error => {
                setFetchingBearer(false);
                console.log(error);
            })

    }, [username])

    function handleEnterLobby(event) {
        event.preventDefault();
        setUsername(usernameField.current.value);
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
                                <input type="text" ref={usernameField} className="form-control" aria-describedby="username-help" />
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

  const [bearerToken, setBearerToken] = React.useState(() => {
      return window.localStorage.getItem("bearerToken") || null;
  });

  if (!bearerToken) {
    return (
        <div className="App">
            <Login setBearerToken={setBearerToken} bearerToken={bearerToken} />
        </div>
    )
  }
  else {
      return (
          <div>You are logged in!</div>
      )
  }
}

export default App;
