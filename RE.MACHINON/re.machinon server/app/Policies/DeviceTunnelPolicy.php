<?php

namespace Remachinon\Policies;

use Remachinon\Models\DeviceTunnel;
use Remachinon\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class DeviceTunnelPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can connect the tunnel.
     *
     * @param  \Remachinon\Models\User  $user
     * @param  \Remachinon\Models\DeviceTunnel  $device_tunnel
     * @return mixed
     */
    public function connect(User $user, DeviceTunnel $device_tunnel)
    {
        return $device_tunnel->device->is_enabled
            && $user->id === $device_tunnel->device->user_id;
    }
}
