package com.examplereactnative.ecr;

import android.os.Message;
import android.util.Log;
import android.os.Handler;
import android.os.Looper;

import com.examplereactnative.ecr.models.PosMessage;
import com.examplereactnative.ecr.models.PosTerminal;
import com.facebook.react.bridge.Promise;
import com.google.gson.Gson;

import org.json.JSONObject;
import org.json.JSONException;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

public class MessageManager {
    private static final String TAG = "MessageManager";

    private static final int PORT = 8888;
    private static final int BUFFER_SIZE = 4096;
    private static final int CONNECT_TIMEOUT_MS = 10000;
    private static final int READ_TIMEOUT_MS = 30000;

    private PosTerminal connectedTerminal;
    private Socket socket;
    private InputStream inputStream;
    private OutputStream outputStream;
    private BufferedReader reader;
    private PrintWriter writer;

    private final Handler onReply;
    private final ExecutorService executor;
    private final Handler mainHandler;
    private final AtomicBoolean isConnected;

    // Connection callbacks
    private Promise connectionCallback;

    public MessageManager(Handler onReply) {
        this.onReply = onReply;
        this.executor = Executors.newSingleThreadExecutor();
        this.mainHandler = new Handler(Looper.getMainLooper());
        this.isConnected = new AtomicBoolean(false);
    }

    /**
     * Callback interface for promise resolution
     */
    public interface PromiseCallback {
        void onResolve(Object result);
        void onReject(String code, String message, Exception error);
    }

    /**
     * Get currently connected terminal
     */
    public PosTerminal getStatus() {
        return connectedTerminal;
    }

    /**
     * Connect to a terminal
     */
    public void connect(PosTerminal terminal, Promise promise) {
        Log.i(TAG, "Connecting to " + terminal.sourceIp);

        disconnect(); // Clean up any existing connection

        connectedTerminal = terminal;
        connectionCallback = promise;
        isConnected.set(true);

        executor.execute(new Runnable() {
            @Override
            public void run() {
                doConnect(terminal);
            }
        });
    }

    private void doConnect(PosTerminal terminal) {
        try {
            socket = new Socket();

            // Connect to the terminal
            socket.connect(
                    new InetSocketAddress(terminal.sourceIp, PORT),
                    CONNECT_TIMEOUT_MS
            );

            socket.setSoTimeout(READ_TIMEOUT_MS);
            socket.setKeepAlive(true);

            // Get streams
            inputStream = socket.getInputStream();
            outputStream = socket.getOutputStream();

            // Create reader/writer for text operations
            reader = new BufferedReader(
                    new InputStreamReader(inputStream, StandardCharsets.UTF_8),
                    BUFFER_SIZE
            );
            writer = new PrintWriter(
                    new OutputStreamWriter(outputStream, StandardCharsets.UTF_8),
                    true // autoFlush
            );

            isConnected.set(true);

            // Notify success on main thread
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    if (connectionCallback != null) {
                        connectionCallback.resolve(null);
                        connectionCallback = null;
                    }
                }
            });

            Log.i(TAG, "Connection opened");

            // Start listening for responses
            startReceiving();

        } catch (final IOException e) {
            Log.e(TAG, "Connection failed: " + e.getMessage());

            isConnected.set(false);

            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    if (connectionCallback != null) {
                        connectionCallback.reject("ConnectionFailed", e.getMessage(), e);
                        connectionCallback = null;
                    }
                }
            });

            disconnect();
        }
    }

    /**
     * Disconnect from server
     */
    public void disconnect() {
        String sourceIp = connectedTerminal != null ? connectedTerminal.sourceIp : "unknown";
        Log.i(TAG, "Disconnecting from " + sourceIp);

        isConnected.set(false);

        // Close reader
        if (reader != null) {
            try {
                reader.close();
            } catch (IOException e) {
                Log.e(TAG, "Error closing reader: " + e.getMessage());
            }
            reader = null;
        }

        // Close writer
        if (writer != null) {
            writer.close();
            writer = null;
        }

        // Close streams
        if (inputStream != null) {
            try {
                inputStream.close();
            } catch (IOException e) {
                Log.e(TAG, "Error closing input stream: " + e.getMessage());
            }
            inputStream = null;
        }

        if (outputStream != null) {
            try {
                outputStream.close();
            } catch (IOException e) {
                Log.e(TAG, "Error closing output stream: " + e.getMessage());
            }
            outputStream = null;
        }

        // Close socket
        if (socket != null && !socket.isClosed()) {
            try {
                socket.close();
            } catch (IOException e) {
                Log.e(TAG, "Error closing socket: " + e.getMessage());
            }
            socket = null;
        }

        connectedTerminal = null;
    }

    /**
     * Send message to server
     */
    public void send(final PosMessage message) {
        if (!isConnected.get() || writer == null) {
            Log.e(TAG, "Cannot send - not connected");
            return;
        }

        executor.execute(new Runnable() {
            @Override
            public void run() {
                doSend(message);
            }
        });
    }

    private void doSend(PosMessage message) {
        try {
            // Convert message to JSON
            String jsonString = new Gson().toJson(message);

            // Append newline (LF) for message submission
            jsonString = jsonString + "\n";

            Log.i(TAG, "Sending message: " + jsonString);

            // Write to socket
            writer.print(jsonString);
            writer.flush();

        } catch (Exception e) {
            Log.e(TAG, "Failed to encode message: " + e.getMessage());
        }
    }

    /**
     * Receive loop - runs on background thread
     */
    private void startReceiving() {
        while (isConnected.get() && socket != null && !socket.isClosed()) {
            try {
                String line = reader.readLine();

                if (line == null) {
                    // End of stream
                    Log.e(TAG, "Connection ended (readLine returned null)");
                    break;
                }

                Log.i(TAG, "Received: " + line);

                // Parse JSON response
                try {
                    JSONObject jsonResponse = new JSONObject(line);
                    Message msg = new Message();
                    msg.obj = jsonResponse;

                    onReply.sendMessage(msg);
                } catch (JSONException e) {
                    Log.e(TAG, "Failed to decode message: " + e.getMessage());
                }

            } catch (SocketTimeoutException e) {
                // Timeout is expected, continue loop
                continue;
            } catch (IOException e) {
                if (isConnected.get()) {
                    Log.e(TAG, "Receive error: " + e.getMessage());
                }
                break;
            }
        }

        // Connection ended
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                disconnect();
            }
        });
    }

    public boolean isConnected() {
        return isConnected.get() && socket != null && socket.isConnected() && !socket.isClosed();
    }

    public void destroy() {
        disconnect();
        executor.shutdown();
    }
}