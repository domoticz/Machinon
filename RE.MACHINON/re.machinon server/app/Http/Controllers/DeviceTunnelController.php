<?php

namespace Remachinon\Http\Controllers;

use Remachinon\Models\DeviceTunnel;
use Bluerhinos\phpMQTT;
use Carbon\Carbon;
use Ramsey\Uuid\Uuid;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Storage;

class DeviceTunnelController extends Controller
{
    // @todo DeviceTunnelController needs A LOT of cleaning

    /**
     * Opens the tunnel with the remote device
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function connect($id)
    {
        try {
            $device_tunnel = DeviceTunnel::findOrFail($id);
            $this->authorize('connect', $device_tunnel);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'failure',
                'response_body' => null,
                'message' => 'Device not found'
            ], 404);
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => 'failure',
                'response_body' => null,
                'message' => 'Unauthorized'
            ], 401);
        }

        /**
         * Checks tunnel is already enabled, if so, just reload the page
         */

        // It may happen that somebody opens the tunnel while you already have the listing page loaded with the
        // "open tunnel" icon. So if you click "open tunnel" the tunnel may have been already opened....
        // We return the UUID and the web will call the ajax status() action as usual, which will then redirect to the page
        if ($device_tunnel->is_enabled && Carbon::parse($device_tunnel->updated_at)
                                                    ->addHours(2)
                                                    ->greaterThan(now())) {
            $retry = 1;
            do {
                $fp = @fsockopen("127.0.0.1", $device_tunnel->port, $errno, $errstr, 30);
                if ($fp) {
                    // Updating the updated_at field
                    $device_tunnel->save(['updated_at' => now()]);
                    return response()->json([
                        'code' => 'success',
                        'response_body' => [
                            'uuid' => $device_tunnel->uuid
                        ],
                        'message' => null
                    ]);
                } else {
                    sleep (1);
                    $retry++;
                }
            } while ($retry <= 5); // Try connecting up to 5 times
            // Tunnel is opened and confirmed, but cannot connect
            // Something went wrong. Disconnect and try again
            // If tunnel is enabled AND unable to connect, something bad happened...
            // Closing tunnel and sending custom message
            return $this->disconnect($device_tunnel->id)
                        ->setStatusCode(408)
                        ->setJson(\GuzzleHttp\json_encode([
                            'status' => 'failure',
                            'response_body' => null,
                            'message' => 'Device unreachable, tunnel closed'
                        ]));
        }

        /**
         * Choose the tunnel port
         */

        $tunnel_ports = array(10001, 30000);
        $port_found = false;
        $tryout_counter = 0;
        $used_ports = [];
        // Command to read used ports is different in each OS
        // @todo \PROCESS should work but returns cwd errors. Using exec(). I'll fix it later
        switch(config('app.os')) {
            case 'windows': // @todo Read used ports in windows
                break;
            case 'osx': // Read used ports in osx
                exec("lsof -i -n -P | grep -i \"listen\" | awk '{print $9}' | sed -e 's/.*://'", $used_ports, $exec_out);
                // We can use both options, lsof is quicker
//                $process = new Process("netstat -anp tcp | grep -i 'listen' | awk '{print $4}' | sed -e 's/.*\.//'");
//                $process = new Process("lsof -i -n -P | grep -i 'listen' | awk '{print $9}' | sed -e 's/.*://'");
                break;
            case 'linux': // Read used ports in linux
            default:
                exec("netstat -lnt | awk '{print $4}' | sed -e 's/.*://'", $used_ports, $exec_out);
    //            $process = new Process("netstat -lnt | awk '{print $4}' | sed -e 's/.*://'");
                break;
        }
        if (!empty($exec_out)) {
            return response()->json([
                'status' => 'failure',
                'response_body' => null,
                'message' => 'Connection timed out'
            ], 408);
        }
        // @todo Uncomment this block when enabling \PROCESS
//        if ($process) {
//            try {
//                $process->mustRun();
//                $used_ports = $process->getOutput();
//            } catch (ProcessFailedException $e) {
//                return back()->with('error', $e->getMessage());
//            }
//        }
        $used_ports = array_unique($used_ports, SORT_STRING);

        /**
         * Check port range to find one free
         */

        do {
            // Choose random port and check
            $next_port = rand($tunnel_ports[0], $tunnel_ports[1]);
            if (DeviceTunnel::where('port', $next_port)->first()
                    || in_array($next_port, $used_ports)) {
                // Port in use, add to the block list and try again
                array_push($used_ports, $next_port);
                $tryout_counter++;
            } else {
                // Tries to connect to port. If TCP connection fails, port is available
                if (!@fsockopen("127.0.0.1", $next_port, $errno, $errstr, 10)) {
                    $port_found = $next_port;
                }
            }
        } while (!$port_found && $tryout_counter > 60); // After 60 tries, something happens....
        // No ports available, return error...
        if (!$port_found)  {
            return response()->json([
                'status' => 'failure',
                'response_body' => null,
                'message' => 'Unable to establish connection'
            ], 408);
        }

        $device_tunnel->port = $port_found;
        $device_tunnel->uuid = UUID::uuid4();

        // Before saving, reset other tunnels using the same port/uuid
        DeviceTunnel::where('device_id', '<>', $device_tunnel->device_id)
                    ->where(function ($query) use ($device_tunnel) {
                        return $query->where('port', '=', $device_tunnel->port)
                                     ->orWhere('uuid', '=', $device_tunnel->uuid);
                    })
                    ->update(DeviceTunnel::$defaults);

        // All clear! Update tunnel record
        $device_tunnel->save();

        /**
         * Updating the domoproxy file
         */

        $newset = '';
        if (!Storage::exists('domoproxy')) {
            Storage::put('domoproxy','');
        }
        // @todo I don't like doing this way... probably will go back to ol' fopen file handling (@LeSENSE)...
        $domoproxy = explode("\n",Storage::get('domoproxy'));
        // Removing any duplicated UUID using the current port
        foreach ($domoproxy as $line) {
            if (!empty($line) && !preg_match("/(?:{$device_tunnel->uuid}|\\s{$device_tunnel->port})/", $line)) {
                $newset .= $line . "\n";
            }
        }
        $newset .= $device_tunnel->uuid . ' ' . $device_tunnel->port . "\n";
        // Add the current set to domoproxy file
        Storage::put('domoproxy', $newset);

        /**
         * Generating a new temporary API hash to let the machinon-agent call the confirmation endpoint
         */

        $tokenResult = auth()->user()->createToken('Remote Tunnel Token', ['connect-tunnel']);
        $token = $tokenResult->token;
        $token->expires_at = now()->addMinutes(5);
        $token->save();

        /**
         * Sending the MQTT message to the Machinon Agent
         */

        $server = config('services.mqtt.host');
        $port = config('services.mqtt.port');
        $username = config('services.mqtt.username');
        $password = config('services.mqtt.password');
        $client_id = config('services.mqtt.client_id').$device_tunnel->device->muid;
        $cafile = null;
        if ($port != '1083' && Storage::exists('mqtt_cert.pem')) {
            $cafile = Storage::path('mqtt_cert.pem');
        }
        $mqtt = new phpMQTT($server, $port, $client_id, $cafile);
        // MQTT Topic
        $mqtt_topic = "remote/" . $device_tunnel->device->muid;
        $mqtt_mesagge = json_encode([
            'tunnel' => 'open',
            'port' => (string)$device_tunnel->port,
            'uuid' => $device_tunnel->uuid,
            'access_token' => $tokenResult->accessToken,
            'token_type'    => 'Bearer',
            'expires_at'    => Carbon::parse(
                $tokenResult->token->expires_at)
                ->toDateTimeString(),
        ]);
        // Try to send the message up to 5 times...
        $tryagain = 1;
        do {
            if ($mqtt->connect(true, NULL, $username, $password)) {
                $mqtt->publish($mqtt_topic, $mqtt_mesagge, 0);
                $mqtt->close();
                $tryagain = 10;
            } else {
                sleep(1);
                $tryagain++;
            }
        } while ($tryagain <= 5);

        // All okay, sending uuid and leaving the rest of the asking to status()
        return response()->json([
            'code' => 'success',
            'response_body' => [
                'uuid' => $device_tunnel->uuid
            ],
            'message' => null
        ]);
    }

    /**
     * Closes the tunnel with the remote device
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function disconnect($id)
    {
        // This forces the RestTrait::isApiAction() method handle exception as API responses (too shabby?)
        try {
            $device_tunnel = DeviceTunnel::findOrFail($id);
            $this->authorize('connect', $device_tunnel);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'failure',
                'response_body' => null,
                'message' => 'Device not found'
            ], 404);
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => 'failure',
                'response_body' => null,
                'message' => 'Unauthorized'
            ], 401);
        }

        /**
         * Sending the MQTT close message
         */

        $server = config('services.mqtt.host');
        $port = config('services.mqtt.port');
        $username = config('services.mqtt.username');
        $password = config('services.mqtt.password');
        $client_id = config('services.mqtt.client_id').$device_tunnel->device->muid;
        $cafile = null;
        if ($port != '1083' && Storage::exists('mqtt_cert.pem')) {
            $cafile = Storage::path('mqtt_cert.pem');
        }
        $mqtt = new phpMQTT($server, $port, $client_id, $cafile);
        // MQTT Topic
        $mqtt_topic = "remote/" . $device_tunnel->device->muid;
        $mqtt_mesagge = json_encode(array(
            'tunnel' => 'close'
        ));
        // Try to send the message up to 5 times...
        $tryagain = 1;
        do {
            if ($mqtt->connect(true, NULL, $username, $password)) {
                $mqtt->publish($mqtt_topic, $mqtt_mesagge, 0);
                $mqtt->close();
                $tryagain = 10;
            } else {
                sleep(1);
                $tryagain++;
            }
        } while ($tryagain <= 5);

        /**
         * Updating the domoproxy file
         */

        $newset = '';
        if (!Storage::exists('domoproxy')) {
            Storage::put('domoproxy','');
        }
        // @todo I hate doing this way... probably will go back to ol' fopen file handling (@LeSENSE)...
        $domoproxy = explode("\n", Storage::get('domoproxy'));
        // Removing any duplicated UUID using the current port
        foreach ($domoproxy as $line) {
            if (!empty($line) && !preg_match("/(?:{$device_tunnel->uuid})/", $line)) {
                $newset .= $line . "\n";
            }
        }
        // Add the current set to domoproxy file
        Storage::put('domoproxy', $newset);

        // Clean up the tunnel attributes (set to null)
        DeviceTunnel::where('id', $id)
                    ->update(DeviceTunnel::$defaults);

        return response()->json([
            'status' => 'success',
            'response_body' => null,
            'message' => null,
        ]);
    }

    /**
     * Checks the status of the tunnel. If connected sents back
     * a javascript that makes the remote website load in a new window
     * @todo send the device a Signed URLs instead of passing access tokens for tunnel confirmation
     *
     * @param \Illuminate\Http\Request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function status($id)
    {
        try {
            $device_tunnel = DeviceTunnel::where('id', $id)
                ->where('is_enabled', '1')
                ->where('updated_at', '>=', now()->subHours(2))
                ->firstOrFail();
            $this->authorize('connect', $device_tunnel);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'failure',
                'response_body' => null,
                'message' => 'Tunnel not ready',
            ],404);
        } catch (AuthorizationException $e) {
            return response()->json([
                'status' => 'failure',
                'response_body' => null,
                'message' => 'Unauthorized'
            ], 401);
        }

        // If we find a tunnel that matches, we check if is still
        // opened and just return to the listing scren
        // to show the right "go" icon link.
        $tryagain = 1;
        do {
            if (@fsockopen("127.0.0.1", $device_tunnel->port, $errno, $errstr, 10)) {
                // This forces the RestTrait::isApiAction() method handle exception as API responses (too shabby?)
                // Send response with temporary API token (for autologin/confirm from the remote device)
                $tokenResult = auth()->user()->createToken('Remote Tunnel Token', ['connect-tunnel']);
                $token = $tokenResult->token;
                $token->expires_at = now()->addMinutes(5);
                $token->save();
                return response()->json([
                    'status' => 'success',
                    'response_body' => [
                        'tunnel_uuid' => $device_tunnel->uuid,
                        'access_token' => $tokenResult->accessToken,
                        'token_type'    => 'Bearer',
                        'expires_at'    => Carbon::parse(
                            $tokenResult->token->expires_at)
                            ->toDateTimeString(),
                    ],
                    'message' => 'Tunnel ready',
                ]);
            } else {
                sleep (1);
                $tryagain++;
            }
        } while ($tryagain <= 25);
        // If tunnel is enabled AND unable to connect, something bad happened...
        // Closing tunnel and sending custom message
        return $this->disconnect($device_tunnel->id)
                    ->setStatusCode(408)
                    ->setJson(\GuzzleHttp\json_encode([
                        'status' => 'failure',
                        'response_body' => null,
                        'message' => 'Device unreachable, tunnel closed'
                    ]));
    }

    /**
     * This is an authorization method for Machinon remote sites based on receiving the API access token that LeSENSE sends to
     * the Machinon site when requesting the link establishment and the special token with port (the transparent tunnel login)
     *
     * @param string $uuid
     * @return \Illuminate\Http\JsonResponse
     */
    public function confirm($uuid)
    {
        try {
            $device_tunnel = DeviceTunnel::where('uuid', $uuid)
                ->firstOrFail();
            $this->authorize('connect', $device_tunnel);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'status' => 'failure',
                'response_body' => null,
                'message' => 'Device not found',
            ], 404);
        }
        // Device has called home successfully so everything's ready to go, set tunnel enabled to true
        $device_tunnel->is_enabled = true;
        $device_tunnel->save();
        return response()->json([
            'status' => 'success',
            'response_body' => null,
            'message' => 'null',
        ]);
    }

    /**
     * @return \Illuminate\Http\JsonResponse
     */
    public function cron()
    {
        // @todo DeviceTunnels@cron must go on Console instead of Http, run it through command line
        // @todo Before updating old records we should also update the domoproxy file
        DeviceTunnel::where('updated_at', '<', Carbon::now()->subHours(2))
                    ->update(DeviceTunnel::$defaults);
        return response()->json([
            'response_body' => 'OK.'
        ]);
    }
}
