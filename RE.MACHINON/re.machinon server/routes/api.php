<?php

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Prefix is related to the URL "prefix" used to trigger the route. eg /api/v1/auth/login
Route::group(['prefix' => 'auth'], function () {
    Route::post('login', 'AuthController@login')->middleware('throttle:5,1');
    Route::post('signup', 'AuthController@signup')->middleware('ipcheck:registration');
    Route::get('logout', 'AuthController@logout')->middleware('auth:api');
});

// You must use ['scopes:'] (empty value) to allow only tokens with an empty scope.
Route::group(['middleware' => ['auth:api', 'scopes:connect-tunnel']], function() {
    Route::get('tunnels/{uuid}/status', 'DeviceTunnelController@status')->name('api.tunnels.status');
    Route::put('tunnels/{uuid}/confirm', 'DeviceTunnelController@confirm');
});

// These are the three API endpoints that handle mosquitto_auth_plugin authentication and ACL permissions
Route::group(['prefix' => 'mosquitto'], function () {
    Route::post('getuser', 'MosquittoController@getuser');
    Route::post('superuser', 'MosquittoController@superuser');
    Route::post('aclcheck', 'MosquittoController@aclcheck');
});

// @todo this should go in console.php
Route::get('tunnels/cron', 'DeviceTunnelController@cron');
