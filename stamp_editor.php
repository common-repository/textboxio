<?php

// This is inspired by: http://stackoverflow.com/questions/6195451/how-to-get-wp-include-directory
$wp_include_dir = preg_replace('/wp-content$/', 'wp-includes', WP_CONTENT_DIR);
$filename = "$wp_include_dir/class-wp-editor.php";

// This is inspired by: http://stackoverflow.com/questions/4555186/using-two-class-with-the-same-name
$wordpress_wp_editors_file = file_get_contents($filename, true);
$wordpress_wp_editors_file = preg_replace('/class _WP_Editors/i', 'class _WP_Editors_Tiny', $wordpress_wp_editors_file);
eval('?>'.$wordpress_wp_editors_file);

//Overrides class-wp-editor.php
final class _WP_Editors
{
    
    private function _construct()
    {
    }
    
    public static function editor_settings($editor_id, $set)
    {
        if ($editor_id != 'content') return _WP_Editors_Tiny::editor_settings($editor_id, $set);
    }
    
    public static function parse_settings($editor_id, $settings)
    {
        if ($editor_id != 'content') return _WP_Editors_Tiny::parse_settings($editor_id, $settings);
        return wp_parse_args($settings, array(
            'textarea_name' => $editor_id,
            'tinymce' => true
        ));
    }

    //NOTE: this needs to be public :-(
    public static function enqueue_tbio_scripts(){
        $settings = get_option('tbio_settings');
        $api_key = $settings['api_key']; 
        $api_key_suffix = isset($api_key) ? $api_key : 'static';

        wp_enqueue_script( 'media' );
        wp_enqueue_script('miniland', "https://api.textbox.io/editor/$api_key_suffix");
        wp_enqueue_script('miniland-wordpress', plugins_url('/textboxio-plugin-wordpress-1.1/textboxio-plugin-wordpress-1.1.js'));
        wp_enqueue_script('jquery-modal', plugins_url('/textboxio-plugin-wordpress-1.1/jquery.modal.min.js'));
         //TODO: replacement for different ids
         echo "<script type='text/javascript'>jQuery(window).load(function(){ StampEditors.init('content')});</script>";
    }
    
    public static function editor($content, $editor_id, $raw_settings = array())
    {
        if ($editor_id != 'content') return _WP_Editors_Tiny::editor($content, $editor_id, $raw_settings); 
        add_action('admin_footer', array(__CLASS__, 'enqueue_tbio_scripts'),1);
        $settings      = self::parse_settings($editor_id, $raw_settings);
        $using_textbox = user_can_richedit();
        $rows          = get_option('default_post_edit_rows', 40);
        $cols          = 40;
        
        $editor_name  = $settings['textarea_name'];
        $editor_css   = empty($settings['editor_css']) ? '' : $settings['editor_css'];
        $switch_class = $using_textbox ? 'textbox-active' : 'html-active';
        
        $textarea = "<textarea name='$editor_name' class='wp-editor-area' id='$editor_id' rows='$rows' cols='$cols'>$content</textarea>";
        self::skeleton($editor_id, $editor_css, $switch_class, $textarea);
    }
    
    // FIX: Don't echo here.
    private static function skeleton($editor_id, $editor_css, $switch_class, $textarea)
    {
        $tbio_switch = self::switch_editor($editor_id, "textbox", __("WYSIWYG"));
        $html_switch = self::switch_editor($editor_id, "html", __("HTML"));
        
        echo "<div id='wp-{$editor_id}-wrap' class='wp-editor-wrap {$switch_class}'>\n";
        self::print_editor_css_once();
        echo "  {$editor_css}\n";
        echo "  <div id='wp-{$editor_id}-editor-tools' class='wp-editor-tools'>\n";
        echo "    {$html_switch}";
        echo "    {$tbio_switch}";
        echo "  </div>\n";
        echo "  <div id='wp-{$editor_id}-editor-container' class='wp-editor-container'>\n";
        echo "    {$textarea}\n";
        echo "  </div>\n";
        echo "</div>\n";
        wp_nonce_field('internal-linking', '_ajax_linking_nonce', false);
        
    }
    
    private static function switch_editor($editor_id, $type, $text)
    {
        $click = "\"StampEditors.switchTo('{$editor_id}', '{$type}');\"";
        return "<a id='{$editor_id}-{$type}' class='wp-switch-editor switch-{$type}' onclick={$click}>{$text}</a>\n";
    }
    
    private static function print_editor_css_once()
    {
        static $editor_buttons_done = false;
        if (!$editor_buttons_done) {
            wp_print_styles('editor-buttons');
            $editor_buttons_done = true;
        }
    }

    public static function enqueue_scripts() {
        return _WP_Editors_Tiny::enqueue_scripts();
    }

    public static function editor_js() {
        return _WP_Editors_Tiny::editor_js();
    }

    public static function wp_fullscreen_html() {
        return _WP_Editors_Tiny::wp_fullscreen_html();
    }

    // INVESTIGATE: Is this redefined below? Probably not.
    // public static function wp_link_query( $args = array() ) {
    //     return _WP_Editors_Tiny::wp_link_query($args);
    // }

    public static function wp_link_dialog() {
        return _WP_Editors_Tiny::wp_link_dialog();
    }
}


add_action('wp_ajax_ephox_getlinks', 'ephox_get_links');


function ephox_get_links()
{
    
    check_ajax_referer('internal-linking', '_ajax_linking_nonce');
    
    $args = array();
    
    if (isset($_POST['search']))
        $args['s'] = stripslashes($_POST['search']);
    $args['pagenum'] = !empty($_POST['page']) ? absint($_POST['page']) : 1;
    
    $results = wp_link_query($args);
    
    if (!isset($results))
        wp_die(0);
    
    echo json_encode($results);
    echo "\n";
    
    wp_die();
}


/**
 * Performs post queries for internal linking.
 *
 * @param array $args Optional. Accepts 'pagenum' and 's' (search) arguments.
 * @return array Results.
 */
function wp_link_query($args = array())
{
    $pts      = get_post_types(array(
        'public' => true
    ), 'objects');
    $pt_names = array_keys($pts);
    
    $query = array(
        'post_type' => $pt_names,
        'suppress_filters' => true,
        'update_post_term_cache' => false,
        'update_post_meta_cache' => false,
        'post_status' => 'publish',
        'order' => 'DESC',
        'orderby' => 'post_date',
        'posts_per_page' => 20
    );
    
    $args['pagenum'] = isset($args['pagenum']) ? absint($args['pagenum']) : 1;
    
    if (isset($args['s']))
        $query['s'] = $args['s'];
    
    $query['offset'] = $args['pagenum'] > 1 ? $query['posts_per_page'] * ($args['pagenum'] - 1) : 0;
    
    // Do main query.
    $get_posts = new WP_Query;
    $posts     = $get_posts->query($query);
    // Check if any posts were found.
    if (!$get_posts->post_count)
        return false;
    
    // Build results.
    $results = array();
    foreach ($posts as $post) {
        if ('post' == $post->post_type)
            $info = mysql2date(__('Y/m/d'), $post->post_date);
        else
            $info = $pts[$post->post_type]->labels->singular_name;
        
        $results[] = array(
            'ID' => $post->ID,
            'title' => trim(esc_html(strip_tags(get_the_title($post)))),
            'permalink' => get_permalink($post->ID),
            'info' => $info
        );
    }
    
    return $results;

}

?>
