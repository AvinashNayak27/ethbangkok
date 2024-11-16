const express = require("express");
require("dotenv").config();

const app = express();
const port = 3000;

const accessToken = process.env.ACCESS_TOKEN;
// GitHub API endpoint to fetch repositories where the user is a contributor
const url = `https://api.github.com/users/bablu573/events`;

const headers = {
  Authorization: `token ${accessToken}`,
  Accept: "application/vnd.github.v3+json",
};

fetch(url, { headers })
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
  })
  .catch((error) => {
    console.error("Error fetching repositories:", error);
  });
