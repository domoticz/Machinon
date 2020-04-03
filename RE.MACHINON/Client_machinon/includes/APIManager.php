<?php
/*
* This class manages API curl requests, all API classes should extend this
*/

class APIManager {

    protected static $token = "";
    protected static $url = "";

    /**
	 * Curl service function for handling POST requests
	 * 
	 * @param string $page
	 * @param array $args
	 * @param int $timeout
	 * @param array $extraHeaders
	 * @return string
	 */
    protected static function postUrl($page, $args = [], $timeout = 10, $extraHeaders = []){
		$ch = curl_init($page);
		$referer = $_SERVER['REQUEST_SCHEME'] . '//' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
		curl_setopt($ch, CURLOPT_POST, 1);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
		curl_setopt($ch, CURLOPT_FORBID_REUSE, 1);
		curl_setopt($ch, CURLOPT_FRESH_CONNECT, 1);
		curl_setopt($ch, CURLOPT_POSTFIELDS, $args);
		curl_setopt($ch, CURLOPT_AUTOREFERER, true);
		curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
		curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge(['User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64; rv:12.0) Gecko/20100101 Firefox/12.0'], $extraHeaders));
		curl_setopt($ch, CURLOPT_REFERER, $referer);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, (int) $timeout);
		curl_setopt($ch, CURLOPT_TIMEOUT, (int) $timeout);
		$ret = curl_exec($ch);
		curl_close($ch);
		return $ret;
	}
	
	/**
	 * Curl service function for handling GET requests
	 * 
	 * @param string $page
	 * @param int $timeout
	 * @param array $extraHeaders
	 * @return string
	 */
    protected static function getUrl($page, $timeout = 10, $extraHeaders = []){
		$ch = curl_init($page);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
		curl_setopt($ch, CURLOPT_FORBID_REUSE, 1);
		curl_setopt($ch, CURLOPT_FRESH_CONNECT, 1);
		curl_setopt($ch, CURLOPT_AUTOREFERER, true);
		curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
		curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge(['User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64; rv:12.0) Gecko/20100101 Firefox/12.0'], $extraHeaders));
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, (int) $timeout);
		curl_setopt($ch, CURLOPT_TIMEOUT, (int) $timeout);
		$ret = curl_exec($ch);
		curl_close($ch);
		return $ret;
    }

    /**
     * Curl service function for handling PUT requests
     *
     * @param string $page
     * @param array $args
     * @param int $timeout
     * @param array $extraHeaders
     * @return string
     */
    protected static function putUrl($page, $args = [], $timeout = 10, $extraHeaders = []){
        $ch = curl_init($page);
        $referer = $_SERVER['REQUEST_SCHEME'] . '//' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        curl_setopt($ch, CURLOPT_PUT, 1);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        curl_setopt($ch, CURLOPT_FORBID_REUSE, 1);
        curl_setopt($ch, CURLOPT_FRESH_CONNECT, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $args);
        curl_setopt($ch, CURLOPT_AUTOREFERER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge(['User-Agent: Mozilla/5.0 (Windows NT 6.1; WOW64; rv:12.0) Gecko/20100101 Firefox/12.0'], $extraHeaders));
        curl_setopt($ch, CURLOPT_REFERER, $referer);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, (int) $timeout);
        curl_setopt($ch, CURLOPT_TIMEOUT, (int) $timeout);
        $ret = curl_exec($ch);
        curl_close($ch);
        return $ret;
    }
}