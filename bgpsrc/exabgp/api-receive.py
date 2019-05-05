#!/usr/bin/env python

import sys
import time

while True:
    try:
        line = sys.stdin.readline().strip()
        if 'shutdown' in line:
            print ('   (ok) api.receive shutdown received', line, file=sys.stderr, end=" ")
            sys.stdout.flush()
            sys.exit(1)
        elif 'done' in line:
            print ('   (ok) api.receive done received', line, file=sys.stderr, end=" ")
            sys.stdout.flush()
        elif 'eor' in line:
            print ('   (ok) api.receive eor received', line, file=sys.stderr, end=" ")
            sys.stdout.flush()
        elif 'keepalive' in line:
            print ('   (ok) api.receive keepalive received', line, file=sys.stderr, end=" ")
            sys.stdout.flush()
        elif '0.0.0.0/32' in line:
            print ('   (ok) api.receive 0.0.0.0/32 received', line, file=sys.stderr, end=" ")
            sys.stdout.flush()
            time.sleep(2)  # make sure the other process is faster if it gets any data
            print ("announce route 6.6.6.0/24 next-hop 1.1.1.1")
            sys.stdout.flush()
        else:
            print ('   (failure) api.receive received unexpected data:', line, file=sys.stderr, end=" ")
            sys.stderr.flush()
            print ("announce route 6.6.6.0/24 next-hop 9.9.9.9")
            sys.stdout.flush()
            time.sleep(3)
            sys.exit(1)
    except KeyboardInterrupt:
        sys.exit(1)
    except IOError:
        # most likely a signal during readline
        sys.exit(1)
