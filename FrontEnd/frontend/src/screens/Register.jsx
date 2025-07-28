import React from "react";
import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";
const Register = () => {
  const [email, setemail] = useState("");
  const [password, setpassword] = useState("");

  const { setUser } = useContext(UserContext);
  const nav = useNavigate();
  const submitHandler = (e) => {
    e.preventDefault();
    axios
      .post("/user/register", { email, password })
      .then((res) => {
        console.log("token " + res.data.token);
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        nav("/");
      })
      .catch((err) => {
        console.log(err.response.data);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br to-black">
      <div className="bg-gray-900 p-10 rounded-xl shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-white mb-8">Register</h2>
        <form
          className="space-y-6"
          onSubmit={(e) => {
            submitHandler(e);
          }}
        >
          <div>
            <label className="block text-gray-300 mb-2" htmlFor="email">
              Email
            </label>
            <input
              onChange={(e) => {
                setemail(e.target.value);
              }}
              type="email"
              id="email"
              className="w-full p-3 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2" htmlFor="password">
              Password
            </label>
            <input
              onChange={(e) => {
                setpassword(e.target.value);
              }}
              type="password"
              id="password"
              className="w-full p-3 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-700 transition duration-200"
          >
            Create
          </button>
        </form>
        <p className="text-gray-400 mt-6 text-center">
          Login account?{" "}
          <a href="/login" className="text-blue-400 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
