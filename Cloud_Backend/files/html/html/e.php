<?php
$user = $_POST['un'];
$pass = $_POST['pwd'];
if($user=="admin" && $pass=='nopass')
{
    echo "Welcome Admin";
}
else
{
    echo "Wrong Email or Password";
}
?>