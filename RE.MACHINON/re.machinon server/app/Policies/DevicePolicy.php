<?php

namespace Remachinon\Policies;

use Remachinon\Models\User;
use Remachinon\Models\Device;
use Illuminate\Auth\Access\HandlesAuthorization;

class DevicePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can update the device.
     *
     * @param  \Remachinon\Models\User  $user
     * @param  \Remachinon\Models\Device  $device
     * @return mixed
     */
    public function update(User $user, Device $device)
    {
        return $user->id === $device->user_id;
    }
}
