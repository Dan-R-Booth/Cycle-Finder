# Cycle Finder Website

Website created with [Create React App](https://github.com/facebook/create-react-app) and [TypeScript](https://www.typescriptlang.org/) to find the nearsest cycle stations to entered Latitude and Longitude.

## Table of Contents
- [Introduction](#introduction)
- [Technologies](#technologies)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [API Reference](#api-reference)

## Introduction

This website allows users to find the *n* nearest cycle stations, from a selected provider, to an entered latitude and longitude. The number of stations displayed (*n*) can be set be the user and is preset to 5.

I used a REST API ([Citybikes](https://api.citybik.es/v2/)) to collect the data which the website users to find the closest Cycle Stations, and retrieved this data using `fetch` with `async await` and then transforming the data into `json` format so that it can be read.

## Technologies

Project created with:

* [Create React App](https://github.com/facebook/create-react-app)
* [TypeScript 4](https://www.typescriptlang.org/)
* [Bootstrap 5](https://getbootstrap.com/docs/5.0)
* [React Bootstrap 2](https://react-bootstrap.netlify.app/)
* [Font Awesome](https://fontawesome.com/icons)

## Getting Started

### Prerequisites

Make sure you have first intalled [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/package/npm/)

### Installation

You can install and run the project with the following steps:

1. Download the file [cycle-finder.zip](cycle-finder.zip), and extract it in a location you wish to run the project
2. Naviagte to the *cycle-finder* folder extracted in the terminal and run the following:

   ```
   npm install -g serve
   serve -s build
   ```

   The first command installs [serve](https://github.com/vercel/serve) to run the project using [Node.js](https://nodejs.org/).</br>
   The last command shown above will serve the site on the port *3000*.
   <sub>For more information on serve (e.g. running on different ports) see the [serve GitHub page](https://github.com/vercel/serve).</sub>
3. You can then acess the website in a browser with the URl:</br>

   ```
   localhost:3000
   ```
   <sup>*(Where `3000` is the port number the site is being served on)*</sup>

## API Reference

The [Citybikes API](https://api.citybik.es/v2/) was used to retreive the Cycle Station data. The Documnetation for this REST API can be found at [https://api.citybik.es/v2/](https://api.citybik.es/v2/), and if you use API in your own project you must indicate it on your app and website, linking the docs page.
