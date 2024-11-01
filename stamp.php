<?php
/*
Plugin Name: Textbox.io 
Plugin URI: https://textbox.io
Description: The Textbox.io Wordpress plugin adds the Textbox.io writing experience to your Wordpress site. Textbox.io brings a host of great features to Wordpress, including: Link Previews, Emoji, Snippets, Image Resizing, and <a href="https://textbox.io#features">much more</a>. Note: If you have not registered your Wordpress site domain name with Textbox.io you will be prompted to do so the first time you add or edit a post. 
Version: 1.1
Author: Ephox
*/

include_once('stamp_activation_alert.php');

function init_stamp()
{
    wp_enqueue_style('ephox-plugin-styling', plugins_url('/textboxio-plugin-wordpress-1.1/ephox.css'));
}

$tbio_options = get_option('tbio_settings');
$api_key = $tbio_options['api_key'];
add_action('init', 'init_stamp');

if(isset($_SERVER['HTTP_USER_AGENT']) && (strpos($_SERVER['HTTP_USER_AGENT'],'MSIE') !== false))
{
    exit;
}
else{
    include_once('stamp_editor.php');
}

if (is_admin() ) {
    include_once('stamp_settings.php');
    if($api_key == '') $activation = new TextboxActivationAlert();
    $settings_page = new TextboxSettingsPage(__FILE__);
}

?>
