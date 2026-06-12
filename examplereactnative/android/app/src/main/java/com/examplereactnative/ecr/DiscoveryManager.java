package com.examplereactnative.ecr;

import android.os.Handler;
import android.os.Message;
import android.util.Log;

import com.examplereactnative.ecr.models.PosTerminal;

import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.net.InetSocketAddress;
import java.net.SocketAddress;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class DiscoveryManager {
    private static final String TAG = "DiscoveryManager";

    private static final String WHO_IS_MESSAGE = "PAY.POS-WHO.IS";
    private static final String I_AM_MESSAGE = "PAY.POS-I.AM:";
    private static final int UDP_PORT = 8889;
    private static final int DISCOVERY_TIMEOUT_MS = 5000;
    private static final int BUFFER_SIZE = 65536;

    private static final String BROADCAST_ADDRESS = "255.255.255.255";

    private final Handler onDiscoverHandler;

    private DatagramSocket socket;
    private Thread receiveThread;
    private String localIP;
    private volatile boolean isDiscovering = false;

    public DiscoveryManager(Handler onDiscoverHandler) {
        this.onDiscoverHandler = onDiscoverHandler;
    }

    public boolean isDiscovering() {
        return isDiscovering;
    }

    public void startDiscovery() {
        Log.i(TAG, "Start PAYNL discovery protocol");

        // Discover local IP
        localIP = discoverLocalIP();
        if (localIP == null) {
            Log.e(TAG, "Failed to discover local IP");
            return;
        }
        Log.i(TAG, "Local IP: " + localIP);

        if (!startListening()) {
            Log.e(TAG, "Failed to start listening");
            return;
        }

        if (!broadcastDiscovery()) {
            Log.e(TAG, "Failed to send discovery broadcast");
            return;
        }
    }

    public void stopDiscovery() {
        if (!isDiscovering) {
            return;
        }
        closeSocket();
    }

    private String discoverLocalIP() {
        try {
            List<NetworkInterface> interfaces = Collections.list(NetworkInterface.getNetworkInterfaces());

            String[] preferredOrder = {"en0", "en1", "bridge0", "en2", "en3", "eth0", "wlan0"};

            List<NetworkInterfaceEntry> foundInterfaces = new ArrayList<>();

            for (NetworkInterface networkInterface : interfaces) {
                if (!networkInterface.isUp() || networkInterface.isLoopback()) {
                    continue;
                }

                // Skip excluded interface names
                String name = networkInterface.getName();
                if (name.startsWith("lo") ||
                        name.startsWith("pdp_ip") ||
                        name.startsWith("utun") ||
                        name.startsWith("ap") ||
                        name.startsWith("ipsec") ||
                        name.startsWith("rndis")) {
                    continue;
                }

                List<InetAddress> addresses = Collections.list(networkInterface.getInetAddresses());

                for (InetAddress addr : addresses) {
                    if (addr instanceof Inet4Address) {
                        String ipString = addr.getHostAddress();

                        // Skip link-local addresses
                        if (ipString.startsWith("169.254.")) {
                            continue;
                        }

                        foundInterfaces.add(new NetworkInterfaceEntry(name, ipString));
                    }
                }
            }

            // Find preferred interface and store our IP
            for (String preferred : preferredOrder) {
                for (NetworkInterfaceEntry entry : foundInterfaces) {
                    if (entry.name.equals(preferred)) {
                        Log.i(TAG, "Using interface: " + entry.name + " (" + entry.ip + ")");
                        return entry.ip;
                    }
                }
            }

            // Use first found interface
            if (!foundInterfaces.isEmpty()) {
                NetworkInterfaceEntry first = foundInterfaces.get(0);
                return first.ip;
            }

        } catch (SocketException e) {
            Log.e(TAG, "Error getting network interfaces", e);
        }

        return null;
    }

    private static class NetworkInterfaceEntry {
        String name;
        String ip;

        NetworkInterfaceEntry(String name, String ip) {
            this.name = name;
            this.ip = ip;
        }
    }

    /**
     * Send discovery broadcast to 255.255.255.255
     */
    private boolean broadcastDiscovery() {
        Log.i(TAG, "Sending discovery broadcast to " + BROADCAST_ADDRESS + ":" + UDP_PORT);

        byte[] data = WHO_IS_MESSAGE.getBytes();

        try {
            InetAddress broadcastAddress = InetAddress.getByName(BROADCAST_ADDRESS);
            DatagramPacket packet = new DatagramPacket(data, data.length, broadcastAddress, UDP_PORT);
            socket.send(packet);
            Log.i(TAG, "Broadcast sent successfully");
            return true;
        } catch (IOException e) {
            Log.e(TAG, "Error sending broadcast: " + e.getMessage());
            return false;
        }
    }

    private boolean startListening() {
        if (isDiscovering) {
            Log.i(TAG, "Already listening");
            return true;
        }

        if (!createSocket()) {
            Log.e(TAG, "Failed to create socket");
            return false;
        }

        if (!bindSocket()) {
            closeSocket();
            return false;
        }

        isDiscovering = true;

        receiveThread = new Thread(this::receiveLoop);
        receiveThread.start();

        return true;
    }

    private boolean createSocket() {
        try {
            // Create unbound socket
            socket = new DatagramSocket(null);

            // Set SO_REUSEADDR
            socket.setReuseAddress(true);

            // Enable SO_BROADCAST for broadcast messages
            socket.setBroadcast(true);

            // Set receive timeout to detect cancellation
            socket.setSoTimeout(1000);

            return true;
        } catch (IOException e) {
            Log.e(TAG, "Error creating socket: " + e.getMessage());
            return false;
        }
    }

    private boolean bindSocket() {
        try {
            SocketAddress localAddr = new InetSocketAddress(UDP_PORT);
            socket.bind(localAddr);
            Log.i(TAG, "Socket bound to port " + UDP_PORT);
            return true;
        } catch (IOException e) {
            Log.e(TAG, "Error binding socket: " + e.getMessage());
            return false;
        }
    }

    private void closeSocket() {
        isDiscovering = false;

        if (socket != null) {
            socket.close();
            socket = null;
        }

        if (receiveThread != null) {
            receiveThread.interrupt();
            receiveThread = null;
        }
    }

    private void receiveLoop() {
        byte[] buffer = new byte[BUFFER_SIZE];

        Log.i(TAG, "Listening for responses");

        long startTime = System.currentTimeMillis();
        long timeout = DISCOVERY_TIMEOUT_MS;

        while (isDiscovering && socket != null && !socket.isClosed()) {
            if (System.currentTimeMillis() - startTime > timeout) {
                Log.i(TAG, "Discovery timeout reached");
                break;
            }

            try {
                DatagramPacket packet = new DatagramPacket(buffer, buffer.length);

                socket.receive(packet);

                if (packet.getLength() == 0) {
                    continue;
                }

                InetAddress senderAddress = packet.getAddress();
                String senderIP = senderAddress.getHostAddress();

                // Ignore responses from ourselves
                if (senderIP.equals(localIP)) {
                    continue;
                }

                String message = new String(buffer, 0, packet.getLength(), "UTF-8");

                if (message == null) {
                    Log.w(TAG, "Invalid message received from " + senderIP);
                    continue;
                }

                if (!message.startsWith(I_AM_MESSAGE)) {
                    Log.w(TAG, "Unknown message from " + senderIP + ": " + message);
                    continue;
                }

                // Parse: "PAY.POS-I.AM:<terminalCode>:<terminalName>"
                String payload = message.substring(I_AM_MESSAGE.length());
                String[] splitted = payload.split(":");

                if (splitted.length != 2) {
                    Log.w(TAG, "Invalid message format from " + senderIP + ": " + message);
                    continue;
                }

                String terminalCode = splitted[0];
                String terminalName = splitted[1];

                Log.i(TAG, "Found terminal: " + terminalCode + " at " + senderIP);

                // Create discovery result
                PosTerminal result = new PosTerminal();
                result.sourceIp = senderIP;
                result.terminalCode = terminalCode;
                result.terminalName = terminalName;

                // Emit event
                Message msg = new Message();
                msg.obj = result;

                this.onDiscoverHandler.sendMessage(msg);
            } catch (IOException e) {
                if (!isDiscovering) {
                    // Socket was closed intentionally
                    break;
                }

                // Timeout is expected, continue
                continue;
            }
        }

        stopDiscovery();
    }
}