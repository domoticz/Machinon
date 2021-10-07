<?php
/*
* This class statically interacts with API Logic Energy endpoints and return ready formatted data
* Please save all API params and endpoints private here
*/

class APIAuthenticator extends APIManager
{
    protected static $token = "";
    protected static $url = REMACHINON_API_URL;

    /**
     * API login() expects email or username, both can be used
     * However, the field to send must be "email"
     * $uuid is used to identify the device the user is trying to access
     * @return string
     */
    public static function login($email, $password, $tunnel_uuid)
    {
        $credentials = json_encode([
            'email' => $email,
            'password' => $password,
            'tunnel_uuid' => $tunnel_uuid,
            'remember_me' => false
        ]);
        $headers = ['Content-Type: application/json',
            'Content-Length: ' . strlen($credentials)];
        $result = self::postUrl(self::$url . '/auth/login', $credentials, 10, $headers);
        $result = json_decode($result);
        if ($result->status == 'success') {
            return $result->access_token;
        }
        return false;
    }

    /**
     */
    public static function confirm($access_token, $tunnel_uuid)
    {
        $headers = ['Content-Type: application/json',
            'Authorization: Bearer ' . $access_token];
        $result = self::putUrl(self::$url . '/tunnels/' . $tunnel_uuid . '/confirm', [], 10, $headers);
        $result = json_decode($result);
        if ($result->status == 'success') {
            return $access_token;
        }
        return false;
    }
}