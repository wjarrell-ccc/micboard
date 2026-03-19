import json
import os
import asyncio
import socket
import logging

from tornado import websocket, web, ioloop, escape

import shure
import config
import discover
import offline


# https://stackoverflow.com/questions/5899497/checking-file-extension
def file_list(extension):
    files = []
    dir_list = os.listdir(config.gif_dir)
    # print(fileList)
    for file in dir_list:
        if file.lower().endswith(extension):
            files.append(file)
    return files

# Its not efficecent to get the IP each time, but for now we'll assume server might have dynamic IP
def localURL():
    if 'local_url' in config.config_tree:
        return config.config_tree['local_url']
    try:
        ip = socket.gethostbyname(socket.gethostname())
        return 'http://{}:{}'.format(ip, config.config_tree['port'])
    except:
        return 'https://micboard.io'
    return 'https://micboard.io'

def micboard_json(network_devices):
    offline_devices = offline.offline_json()
    data = []
    discovered = []
    for net_device in network_devices:
        data.append(net_device.net_json())

    if offline_devices:
        data.append(offline_devices)

    gifs = file_list('.gif')
    jpgs = file_list('.jpg')
    mp4s = file_list('.mp4')
    url = localURL()

    for device in discover.time_filterd_discovered_list():
        discovered.append(device)

    return json.dumps({
        'receivers': data, 'url': url, 'gif': gifs, 'jpg': jpgs, 'mp4': mp4s,
        'config': config.config_tree, 'discovered': discovered
    }, sort_keys=True, indent=4)

class IndexHandler(web.RequestHandler):
    def get(self):
        self.render(config.app_dir('demo.html'))

class AboutHandler(web.RequestHandler):
    def get(self):
        self.render(config.app_dir('static/about.html'))

class JsonHandler(web.RequestHandler):
    def get(self):
        self.set_header('Content-Type', 'application/json')
        self.write(micboard_json(shure.NetworkDevices))

class SocketHandler(websocket.WebSocketHandler):
    clients = set()

    def check_origin(self, origin):
        return True

    def open(self):
        self.clients.add(self)

    def on_close(self):
        self.clients.remove(self)

    @classmethod
    def close_all_ws(cls):
        for c in cls.clients:
            c.close()

    @classmethod
    def broadcast(cls, data):
        for c in cls.clients:
            try:
                c.write_message(data)
            except:
                logging.warning("WS Error")

    @classmethod
    def ws_dump(cls):
        out = {}
        if shure.chart_update_list:
            out['chart-update'] = shure.chart_update_list

        if shure.data_update_list:
            out['data-update'] = []
            for ch in shure.data_update_list:
                out['data-update'].append(ch.ch_json_mini())

        if config.group_update_list:
            out['group-update'] = config.group_update_list

        if out:
            data = json.dumps(out)
            cls.broadcast(data)
        del shure.chart_update_list[:]
        del shure.data_update_list[:]
        del config.group_update_list[:]

class SlotHandler(web.RequestHandler):
    def get(self):
        self.write("hi - slot")

    def post(self):
        data = json.loads(self.request.body)
        self.write('{}')
        for slot_update in data:
            config.update_slot(slot_update)
            print(slot_update)

class ConfigHandler(web.RequestHandler):
    def get(self):
        self.write("hi - slot")

    def post(self):
        data = json.loads(self.request.body)
        print(data)
        self.write('{}')
        config.reconfig(data)

class GroupUpdateHandler(web.RequestHandler):
    def get(self):
        self.write("hi - group")

    def post(self):
        data = json.loads(self.request.body)
        config.update_group(data)
        print(data)
        self.write(data)

class MicboardReloadConfigHandler(web.RequestHandler):
    def post(self):
        print("RECONFIG")
        config.reconfig()
        self.write("restarting")



# https://stackoverflow.com/questions/12031007/disable-static-file-caching-in-tornado
class NoCacheHandler(web.StaticFileHandler):
    def set_extra_headers(self, path):
        # Disable cache
        self.set_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')


def twisted():
    app = web.Application([
        (r'/', IndexHandler),
        (r'/about', AboutHandler),
        (r'/ws', SocketHandler),
        (r'/data.json', JsonHandler),
        (r'/api/group', GroupUpdateHandler),
        (r'/api/slot', SlotHandler),
        (r'/api/config', ConfigHandler),
        # (r'/restart/', MicboardReloadConfigHandler),
        (r'/static/(.*)', web.StaticFileHandler, {'path': config.app_dir('static')}),
        (r'/bg/(.*)', NoCacheHandler, {'path': config.get_gif_dir()}),
        (r'/api/backgrounds', BackgroundListHandler),
        (r'/api/backgrounds/upload', BackgroundUploadHandler),
        (r'/api/backgrounds/delete', BackgroundDeleteHandler),
        (r'/api/backgrounds/download/(.*)', BackgroundDownloadHandler),
        (r'/api/backgrounds/rename', BackgroundRenameHandler)
    ])
    # https://github.com/tornadoweb/tornado/issues/2308
    asyncio.set_event_loop_policy(asyncio.DefaultEventLoopPolicy())
    app.listen(config.web_port())
    ioloop.PeriodicCallback(SocketHandler.ws_dump, 50).start()
    ioloop.IOLoop.instance().start()


class BackgroundListHandler(web.RequestHandler):
    def get(self):
        files = []
        bg_dir = config.get_gif_dir()
        for f in sorted(os.listdir(bg_dir)):
            if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.mp4')):
                path = os.path.join(bg_dir, f)
                stat = os.stat(path)
                files.append({
                    'name': f,
                    'size': stat.st_size,
                    'modified': stat.st_mtime
                })
        self.set_header('Content-Type', 'application/json')
        self.write({'files': files, 'directory': bg_dir})


class BackgroundUploadHandler(web.RequestHandler):
    def post(self):
        import io
        bg_dir = config.get_gif_dir()
        if 'file' not in self.request.files:
            self.set_status(400)
            self.write({'error': 'No file provided'})
            return
        fileinfo = self.request.files['file'][0]
        original_filename = fileinfo['filename'].lower()
        ext = os.path.splitext(original_filename)[1]

        # Get desired name from form field, fall back to original filename base
        desired_name = self.get_argument('name', '').strip().lower()
        if not desired_name:
            desired_name = os.path.splitext(os.path.basename(original_filename))[0]
        # Basic security - strip path components and special chars
        desired_name = os.path.basename(desired_name)

        # MP4 - pass through as-is
        if ext == '.mp4':
            filename = desired_name + '.mp4'
            filepath = os.path.join(bg_dir, filename)
            with open(filepath, 'wb') as f:
                f.write(fileinfo['body'])
            self.write({'success': True, 'filename': filename})
            return

        # Convert image to JPG using Pillow
        convert_types = {'.heic', '.heif', '.webp', '.png', '.bmp', '.tiff', '.tif', '.jpeg', '.jpg'}
        if ext not in convert_types:
            self.set_status(400)
            self.write({'error': f'Unsupported file type: {ext}. Supported types: jpg, png, heic, webp, mp4'})
            return

        try:
            from PIL import Image
            if ext in ('.heic', '.heif'):
                from pillow_heif import register_heif_opener
                register_heif_opener()

            img = Image.open(io.BytesIO(fileinfo['body']))
            # Convert to RGB (handles RGBA, palette mode etc)
            if img.mode in ('RGBA', 'P', 'LA'):
                img = img.convert('RGB')
            filename = desired_name + '.jpg'
            filepath = os.path.join(bg_dir, filename)
            img.save(filepath, 'JPEG', quality=90)
            self.write({'success': True, 'filename': filename, 'converted': ext != '.jpg'})
        except Exception as e:
            self.set_status(500)
            self.write({'error': f'Conversion failed: {str(e)}'})


class BackgroundDeleteHandler(web.RequestHandler):
    def post(self):
        bg_dir = config.get_gif_dir()
        data = json.loads(self.request.body)
        filename = os.path.basename(data.get('filename', ''))
        if not filename:
            self.set_status(400)
            self.write({'error': 'No filename provided'})
            return
        filepath = os.path.join(bg_dir, filename)
        if os.path.exists(filepath):
            os.remove(filepath)
            self.write({'success': True})
        else:
            self.set_status(404)
            self.write({'error': 'File not found'})


class BackgroundDownloadHandler(web.RequestHandler):
    def get(self, filename):
        bg_dir = config.get_gif_dir()
        filename = os.path.basename(filename)
        filepath = os.path.join(bg_dir, filename)
        if not os.path.exists(filepath):
            self.set_status(404)
            return
        self.set_header('Content-Disposition', f'attachment; filename="{filename}"')
        with open(filepath, 'rb') as f:
            self.write(f.read())


class BackgroundRenameHandler(web.RequestHandler):
    def post(self):
        bg_dir = config.get_gif_dir()
        data = json.loads(self.request.body)
        old_name = os.path.basename(data.get('filename', ''))
        new_name = os.path.basename(data.get('new_name', '').strip().lower())
        if not old_name or not new_name:
            self.set_status(400)
            self.write({'error': 'Missing filename or new_name'})
            return
        # Preserve extension
        ext = os.path.splitext(old_name)[1]
        if not os.path.splitext(new_name)[1]:
            new_name = new_name + ext
        old_path = os.path.join(bg_dir, old_name)
        new_path = os.path.join(bg_dir, new_name)
        if not os.path.exists(old_path):
            self.set_status(404)
            self.write({'error': 'File not found'})
            return
        os.rename(old_path, new_path)
        self.write({'success': True, 'filename': new_name})
