@component('mail::message')
# Welcome to People's Multi-Purpose Cooperative!

Your account has been created successfully.

Here are your login credentials:

- **Username:** {{ $username }}
- **Password:** {{ $password }}

Please keep this information secure.

@component('mail::button', ['url' => route('login')])
Login Now
@endcomponent

Thanks,<br>
**People's Multi-Purpose Cooperative**
@endcomponent
