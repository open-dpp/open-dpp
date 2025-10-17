import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;

public class Healthcheck {
    public static void main(String[] args) {
        if (args.length == 0) {
            System.out.println("No URL passed in args");
            System.exit(1);
        }

        String urlString = args[0];

        try {
            URL url = new URL(urlString);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();

            connection.setRequestMethod("GET");
            int responseCode = connection.getResponseCode();

            if (responseCode == HttpURLConnection.HTTP_OK || responseCode == HttpURLConnection.HTTP_NOT_FOUND) {
                System.out.println("HTTP call successful. Exiting...");
                System.exit(0);
            } else {
                System.out.println("HTTP call failed with response code: " + responseCode + ". Exiting...");
                System.exit(1);
            }
        } catch (IOException e) {
            System.out.println("Error occurred while making HTTP call. Exiting...");
            e.printStackTrace();
            System.exit(1);
        }
    }
}