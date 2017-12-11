package com.bleskylinks.bletestproject;

import android.app.ProgressDialog;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanRecord;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.os.Handler;
import android.os.ParcelUuid;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.view.View;
import android.widget.TextView;
import android.widget.ToggleButton;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class BleMain extends AppCompatActivity {

    private BluetoothManager mBluetoothManager;
    private BluetoothAdapter mBluetoothAdapter;
    private BluetoothDevice ble_device;

    private BluetoothGatt mGatt;

    public static String nrf_rx = "0000f101-0000-1000-8000-00805f9b34fb";
    public final static UUID NRF_UUID_RX = UUID.fromString(nrf_rx);

    public static String nrf_tx = "0000f102-0000-1000-8000-00805f9b34fb";
    public final static UUID NRF_UUID_TX = UUID.fromString(nrf_tx);

    public static String nrf_service = "000000f1-0000-1000-8000-00805f9b34fb";
    public final static UUID NRF_UUID_SERVICE = UUID.fromString(nrf_service);

    public ProgressDialog pDialog;


    public BluetoothGattCharacteristic characteristicTX;
    BluetoothLeScanner scanner;
    ScanRecord scan_rec;
    TextView text_ble_scandata;
    TextView ble_status;
    ToggleButton tog_b1;
    int lr[]=new int[3];
    String message;
    int status1;
    MyReceiver1 myReceiver;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        status1=0;
        setContentView(R.layout.activity_ble_main);
        initialize();
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_ble_main, menu);
        return true;
    }



    @Override
    protected void onResume(){

        myReceiver = new MyReceiver1();
        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction("CUSTOM_INTENT");
        registerReceiver(myReceiver, intentFilter);
        ble_status = (TextView) findViewById(R.id.status);
        super.onResume();
        startscand();
        final Handler handler = new Handler();
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                //connectToDevice();
            }
        }, 3000);


    }

    protected void onPause(){
        unregisterReceiver(myReceiver);
        super.onPause();
        stopscand();
        if(mGatt!=null)
        mGatt.close();

    }

    // ---------------------------------- Bluetooth Functions -----------------------------------------//
    /**
     * Initializes a reference to the local Bluetooth adapter.
     *
     * @return Return true if the initialization is successful.
     */
    public boolean initialize() {
        // For API level 18 and above, get a reference to BluetoothAdapter through
        // BluetoothManager.
        Log.i("BleScanning:", "initilizing.......");
        if (mBluetoothManager == null) {
            mBluetoothManager = (BluetoothManager) getSystemService(Context.BLUETOOTH_SERVICE);
            if (mBluetoothManager == null) {
                Log.i("BleScanning:", "Unable to initialize BluetoothManager.");
                return false;
            }
        }

        mBluetoothAdapter = mBluetoothManager.getAdapter();
        if (mBluetoothAdapter == null) {
            Log.i("BleScanning:", "Unable to obtain a BluetoothAdapter.");
            return false;
        }

        if (mBluetoothAdapter == null || !mBluetoothAdapter.isEnabled()) {
            //Bluetooth is disabled
            mBluetoothAdapter.enable();
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        return true;
    }

    // =====   Stop BLE Scanning ==========================
    public void stopscand() {
        Log.i("BLE-----", "Stop Scanning");
        scanner.stopScan(mcallback);
    }


    //========  Start BLE Scanning  ======================================================================
    public void startscand() {
        Log.i("BLE------", "Start Scanning");
        ble_status.setText("Scanning..");
        //pDialog = ProgressDialog.show(this, "BLEUSKYLINKS", "Please wait..", true, false);
        final ParcelUuid UID_SERVICE =
                ParcelUuid.fromString("000000f1-0000-1000-8000-00805f9b34fb");
        scanner = mBluetoothAdapter.getBluetoothLeScanner();
        ScanFilter beaconFilter = new ScanFilter.Builder()
                .setServiceUuid(UID_SERVICE)
                .build();
        ArrayList<ScanFilter> filters = new ArrayList<ScanFilter>();
        filters.add(beaconFilter);
        ScanSettings settings = new ScanSettings.Builder()
                .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                .build();
        scanner.startScan(filters, settings, mcallback);

    }

    //================================
    public ScanCallback mcallback = new ScanCallback() {
        @Override
        public void onScanResult(int callbackType, ScanResult result) {
            int rssi;
            ble_status.setText("Device Found..");
            //pDialog.dismiss();
            ble_device = result.getDevice();
            scan_rec = result.getScanRecord();
            rssi = result.getRssi();
            Log.i("Device....", scan_rec.toString());
            byte sc1[];
            sc1=scan_rec.getManufacturerSpecificData(0);
            for (int i=0;i<sc1.length; i++){
            Log.i("Data-----:", String.valueOf(sc1[i]));
            lr[i]=sc1[i];
            }
            text_ble_scandata = (TextView) findViewById(R.id.ble_scandata);
            text_ble_scandata.setText(String.valueOf(rssi) + scan_rec.toString());
            update_mandata();
        }
    };

    public void update_mandata(){
        int l1=lr[0];
        ToggleButton tg1= (ToggleButton) findViewById(R.id.toggleButton);
        if(l1==0) {
            tg1.setChecked(false);
            tg1.setBackgroundColor(Color.parseColor("#00FF55"));
        }
        else {
            tg1.setChecked(true);
            tg1.setBackgroundColor(Color.parseColor("#FF0055"));
        }

    }

    //===========================================================================
    public BluetoothGattCallback gattCallback = new BluetoothGattCallback() {
        @Override
        public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
            Log.i("onConnectionStateChange", "Status: " + newState);
            status1=newState;

            switch (newState) {
                case BluetoothProfile.STATE_CONNECTED:
                    Log.i("gattCallback", "STATE_CONNECTED");
                    gatt.discoverServices();
                    break;
                case BluetoothProfile.STATE_DISCONNECTED:
                    Log.i("gattCallback", "STATE_DISCONNECTED");
                    Intent intent = new Intent();
                    intent.setAction("CUSTOM_INTENT");
                    intent.putExtra("D1", "STATE_DISCONNECTED");
                    sendBroadcast(intent);
                    break;
                default:
                    Log.i("gattCallback", "STATE_OTHER");
            }
        }

        @Override
        public void onServicesDiscovered(BluetoothGatt gatt, int status) {
            List<BluetoothGattService> services = gatt.getServices();
            BluetoothGattService service1;
            Log.i("onServicesDiscovered", services.toString());
            service1=gatt.getService(NRF_UUID_SERVICE);
            characteristicTX = services.get(2).getCharacteristic(NRF_UUID_TX);
            senddata();
        }

        @Override
        public void onCharacteristicRead(BluetoothGatt gatt,BluetoothGattCharacteristic characteristic, int status) {
            Log.i("onCharacteristicRead", characteristic.toString());
            final byte b1[]=characteristic.getValue();
            for (int i=0;i<b1.length;i++){
                Log.i(":",String.valueOf(b1[i]));
            }
        }

        @Override
        public void onCharacteristicWrite(BluetoothGatt gatt,BluetoothGattCharacteristic characteristic, int status) {
            Log.i("onCharacteristicWrite??", characteristic.toString());
            final byte b1[]=characteristic.getValue();
            for (int i=0;i<b1.length;i++){
                Log.i(":",String.valueOf(b1[i]));
            }
            //gatt.disconnect();
            pDialog.dismiss();
        }

    };

    public void updatestatus(int st){
        /** The profile is in disconnected state */
        //public static final int STATE_DISCONNECTED  = 0;
        /** The profile is in connecting state */
       // public static final int STATE_CONNECTING    = 1;
        /** The profile is in connected state */
        //public static final int STATE_CONNECTED     = 2;
        /** The profile is in disconnecting state */
        //public static final int STATE_DISCONNECTING = 3;
        switch (st){
            case 0: ble_status.setText("STATE_DISCONNECTED");
                break;
            case 1: ble_status.setText("STATE_CONNECTING");
                break;
            case 2: ble_status.setText("STATE_CONNECTED");
                break;
            case 4: ble_status.setText("STATE_DISCONNECTING");
        }
    }

    public void refresh(View v){
        startscand();
    }

    //===============================

    public void disconnect() {
        final Handler handler = new Handler();
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                startscand();
            }
        }, 2000);

    }


    //=================================================================================

    public void connect_device(View v1) {
        stopscand();
        if (ble_device!=null){
            mGatt = ble_device.connectGatt(this, false, gattCallback);
            pDialog = ProgressDialog.show(this, "BLUESKYLINKS", "Please wait..", true, false);
        }
    }

    public void senddata() {
        ToggleButton tg1= (ToggleButton) findViewById(R.id.toggleButton);
        if (tg1.isChecked() ) message = "a";
        else message = "A";
        characteristicTX.setValue(message);
        mGatt.writeCharacteristic(characteristicTX);

    }

    //====================Test code========================

    public void click_button(View v) {
        Handler handler1 = new Handler();
            for (int a = 0; a<4 ;a++) {
                handler1.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                    }
                }, 1000);
            }
    }

    //=================================






    public List<BluetoothGattService> getSupportedGattServices() {
        if (mGatt == null) return null;
        return mGatt.getServices();

    }
    //=================================================================================

    //==========================================================================

    private void setupSerial() {
        String uuid;
        for (BluetoothGattService gattService : getSupportedGattServices()) {
            uuid = gattService.getUuid().toString();
            Log.i("UD",uuid);
            if(uuid.equals("0000f100-0000-1000-8000-00805f9b34fb")) {
                characteristicTX = gattService.getCharacteristic(NRF_UUID_TX);
                Log.i("CR",characteristicTX.getUuid().toString());
                break;
            }
        }


    }

    //===============================

    public void writeCharacteristic(BluetoothGattCharacteristic characteristic) {
        if (mBluetoothAdapter == null || mGatt == null) {
            Log.w("TAG", "BluetoothAdapter not initialized");
            return;
        }
        mGatt.writeCharacteristic(characteristic);
    }

    //============================================
    public class MyReceiver1 extends BroadcastReceiver {
        @Override
        public void onReceive(Context arg0, Intent arg1) {
            String s1 = arg1.getStringExtra("D1");
            Log.i("BLE,,,,,,,",s1);
            ble_status.setText(s1);
            Handler handler1 = new Handler();
            handler1.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        startscand();
                    }
                }, 1000);

        }

    }
















    //===============================================================

    public void startService(View view) {
        startService(new Intent(getBaseContext(), MyService.class));
    }

    // Method to stop the service
    public void stopService(View view) {
        stopService(new Intent(getBaseContext(), MyService.class));
    }

    public void data_pass(View v1){
        //connectToDevice();
        //sendata1("a");
/*
        final Handler handler = new Handler();
        final int n1 = lr[0];
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                //if (n1 == 1) sendata1("A");
                //if (n1 == 0) sendata1("a");
                sendata1("A");
            }
        }, 4000);
*/

    }


}
