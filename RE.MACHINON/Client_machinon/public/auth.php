<?php

namespace MachinonAuth;

use APIAuthenticator;

require_once __DIR__ . '/../config/config.php';

session_start();

$response_token = false;
$redirect = false;
$referer = '';
$access_token = '';

if (!empty($_SERVER['HTTP_REFERER'])) {
    $referer = $_SERVER['HTTP_REFERER'];
}

if (!empty($_POST['access_token'])) {
    $access_token = $_POST['access_token'];
    $tunnel_uuid = $_POST['tunnel_uuid'];
}

// User already logged in (using login or automatic auth from LeSENSE)
if (isset($_SESSION['credentials'])) {
    // Direct request -> add a redirect header to go index page.
    // Otherwise (nginx auth or ajax auth) just need response code.
    if ($access_token) {
        @header("Location: machinon/");
    }
    exit(http_response_code(200));
} else {
    // No session yet, expecting credentials (user/pass or access token)
    if (isset($_POST['username'])) {
        $username = $_POST['username'];
        $password = $_POST['password'];
    } else if (empty($access_token)) {
        exit(http_response_code(401));
    }
}

// Setting safety variables that will allow to identify the machine on LeSENSE
list($server, $port) = explode(':', $_SERVER['HTTP_HOST'] . ':');

if (isset($username)) {
    // Otherwise, the user has opened the remote URL directly (maybe shared URL)
    // the user must perform a login through the index.php page
    if (strpos($server, REMACHINON_HOSTNAME) !== false) {
        // Ask API for credentials... store the API key in session or cookie
        try {
            $response_token = APIAuthenticator::login($username, $password, $tunnel_uuid);
        } catch (Exception $e) {
            //error_reporting(E_USER_WARNING, $e->getMessage());
            exit(http_response_code(500));
        }
    } else {
        // todo USER IS USING LOCALHOST... PERFORM LOCAL AUTENTICATION SOMEHOW...
        // Ask API for credentials... store the API key in session or cookie
        try {
            $response_token = APIAuthenticator::login($username, $password, $port);
        } catch (Exception $e) {
            //error_reporting(E_USER_WARNING, $e->getMessage());
            exit(http_response_code(500));
        }
    }
} else if (isset($access_token)) {
    // Access token received (direct connect from LeSENSE link)
    // Confirm access token received with API confirm
    if (strpos($referer, REMACHINON_HOSTNAME) !== false) {
        // Ask API for credentials... store the API key in session or cookie
        try {
            $response_token = APIAuthenticator::confirm($access_token, $tunnel_uuid);
        } catch (Exception $e) {
            //error_reporting(E_USER_WARNING, $e->getMessage());
            exit(http_response_code(500));
        }
    } else {
        exit(http_response_code(401));
    }
}

// If apitoken is received (user/pass or access token verification)
// let's create session credentials
if (!empty($response_token)) {
    $_SESSION['credentials'] = $response_token;
    // If auth was called from LeSENSE tunnel, redirect to index
    // Otherwise (nginx auth or ajax auth) just return response code
    if ($access_token) {
        @header("Location: machinon/");
    }
    exit(http_response_code(200));
} else {
    // If apitoken not received, destroy session and redirect to login
    // or just return error code (nginx / ajax auth)
    full_logout();
    if ($access_token) {
        @header("Location: index.php");
        exit(http_response_code(200));
    }
    exit(http_response_code(401));
}

function full_logout() {
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), "", time() - 3600, "/");
    }
    $_SESSION = array();
    session_destroy();
}
