<?php

namespace Remachinon\Policies;

use Remachinon\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the auth user can update an user profile.
     *
     * @param  \Remachinon\Models\User  $user
     * @param  \Remachinon\Models\User  $profile
     * @return mixed
     */
    public function update(User $user, User $profile)
    {
        return $user->hasRole('admin') || $user->id === $profile->id;
    }
}
