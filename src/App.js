import React, { useState, useEffect } from "react";
import "./App.css";

function AppFlask() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(true);

  useEffect(() => {
    (async () => {
      const available =
        // eslint-disable-next-line no-undef
        await PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable();
      setBiometricsAvailable(available);

      const storedEmail = localStorage.getItem("userEmail");
      const authToken = localStorage.getItem("authToken");
      if (authToken && storedEmail) {
        setEmail(storedEmail);
        setIsLoggedIn(true);
      }
    })();
  }, []);

  const apiCall = async (endpoint, payload) => {
    const res = await fetch(
      `https://sarthak99.pythonanywhere.com/api/${endpoint}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return res.json();
  };

  const getDeviceId = () => {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
  };

  const handleBiometricVerification = async () => {
    const options = {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: "Ephemeral Biometric Verification" },
      user: {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: email,
        displayName: email,
      },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
    };
    await navigator.credentials.create({ publicKey: options });
  };

  const handleRegister = async () => {
    try {
      if (!email) return setStatus("Enter your email first.");
      setStatus("Registering...");

      try {
        await handleBiometricVerification();
        const res = await apiCall("register-device", {
          deviceId: getDeviceId(),
          email,
          expires: Math.floor(Date.now() / 1000) + 86400,
        });
        res.success
          ? setStatus("Registration successful!")
          : setStatus(`Error: ${res.error}`);
      } catch (e) {
        setStatus(`Registration failed: ${e.message}`);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setStatus(`Registration failed: ${error.message}`);
      return false;
    }
  };

  const handleLogin = async () => {
    try {
      await handleBiometricVerification();
      const res = await apiCall("verify-token", {
        deviceId: getDeviceId(),
        email,
      });

      if (res.valid) {
        localStorage.setItem("authToken", "demo-token");
        localStorage.setItem("userEmail", email);
        setIsLoggedIn(true);
        setStatus("Login successful!");
      } else {
        setStatus(`Login failed: ${res.error}`);
      }
    } catch (error) {
      console.error("Login error:", error);
      setStatus(`Login failed: ${error.message}`);
      return false;
    }
  };

  const handleLogout = () => {
    ["authToken", "userEmail"].forEach((item) => localStorage.removeItem(item));
    setIsLoggedIn(false);
    setEmail("");
    setStatus("Logged out");
  };

  return (
    <div className="App">
      <div className="container">
        <div className="header">
          <img
            className="logo"
            src="https://framerusercontent.com/images/LWvgxNenE5YA1kp60okH4QF8Mk.png?scale-down-to=1024"
            alt="logo"
          />
          <div className="title-decoration">Biometric Authentication</div>
        </div>
        {!biometricsAvailable && (
          <div className="status-message">
            <p>
              ⚠️ This browser doesn't support biometric authentication or it's
              disabled.
            </p>
            <p>
              Please use a device with biometric capabilities (Touch ID, Windows
              Hello, etc.)
            </p>
          </div>
        )}
        {!isLoggedIn ? (
          <div>
            <div className="form-group">
              <input
                type="email"
                className="hawx-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <div className="button-group buttons">
              <button
                className="button"
                onClick={handleLogin}
                disabled={!biometricsAvailable}
              >
                Login
              </button>
              <button
                className="button button-sec"
                onClick={handleRegister}
                disabled={!biometricsAvailable}
              >
                Sign Up
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ paddingBottom: "16px" }} className="status-message">
              You are logged in as {email}
            </p>
            <button className="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
        {status && <p className="status-message">{status}</p>}
      </div>
    </div>
  );
}

export default AppFlask;
