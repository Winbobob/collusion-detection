import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.*;
import java.util.List;

import org.jgrapht.*;
import org.jgrapht.alg.cycle.JohnsonSimpleCycles;
import org.jgrapht.graph.*;
import org.json.JSONArray;
import org.json.JSONObject;

public class TestJGraphT {
    private TestJGraphT()
    {
    } // ensure non-instantiability.

    /**
     * The starting point for the demo.
     *
     * @param args ignored.
     */
    public static void main(String[] args)
    {
        DirectedGraph<String, DefaultEdge> stringGraph = createStringGraph();

        // note undirected edges are printed as: {<v1>,<v2>}
        System.out.println(stringGraph.toString());

        // create a graph based on URL objects
        //DirectedGraph<URL, DefaultEdge> hrefGraph = createHrefGraph();

        // note directed edges are printed as: (<v1>,<v2>)
        //System.out.println(hrefGraph.toString());
        
        JohnsonSimpleCycles<String, DefaultEdge> johnsonSimpleCyclesFinder = new JohnsonSimpleCycles(stringGraph) ;
        List< List<String> > cycles = johnsonSimpleCyclesFinder.findSimpleCycles();
        
        for (int i=0; i<cycles.size();i++){
        	List<String> currentCycle = cycles.get(i);
        	if (currentCycle.size()>4)
        		continue;
        	for (int j=0;j<currentCycle.size(); j++){
        		System.out.print(currentCycle.get(j)+" ");
        	}
        	System.out.println();
        }
    }

    /**
     * Creates a toy directed graph based on URL objects that represents link structure.
     *
     * @return a graph based on URL objects.
     */
    private static DirectedGraph<URL, DefaultEdge> createHrefGraph()
    {
        DirectedGraph<URL, DefaultEdge> g = new DefaultDirectedGraph<>(DefaultEdge.class);

        try {
            URL amazon = new URL("http://www.amazon.com");
            URL yahoo = new URL("http://www.yahoo.com");
            URL ebay = new URL("http://www.ebay.com");

            // add the vertices
            g.addVertex(amazon);
            g.addVertex(yahoo);
            g.addVertex(ebay);

            // add edges to create linking structure
            g.addEdge(yahoo, amazon);
            g.addEdge(yahoo, ebay);
        } catch (MalformedURLException e) {
            e.printStackTrace();
        }

        return g;
    }

    /**
     * Create a toy graph based on String objects.
     * There are 3 cycles in this graph: v1 (to it self), v1-v2, v1-v2-v3-v4 
     *
     * @return a graph based on String objects.
     */
    private static DirectedGraph<String, DefaultEdge> createStringGraph()
    {
        DirectedGraph<String, DefaultEdge> g = new DefaultDirectedGraph<>(DefaultEdge.class);
        
//        String v1 = "v1";
//        String v2 = "v2";
//        String v3 = "v3";
//        String v4 = "v4";
//
//        // add the vertices
//        g.addVertex(v1);
//        g.addVertex(v1);
//        g.addVertex(v2);
//        g.addVertex(v3);
//        g.addVertex(v4);
//
//        // add edges to create a circuit
//        g.addEdge(v1, v2);
//        g.addEdge(v2, v3);
//        g.addEdge(v3, v4);
//        g.addEdge(v4, v1);
//        g.addEdge(v1, v1); //a cycle from a vertex back to it self
//        g.addEdge(v2, v1); //a cycle of two vertices
//        return g;
        
        // output will be [[v1], [v2,v1], [V4,v3,v2,v1]] 
       
        
        try {
			/* using imported json file from Expertiza*/
			File file = new File("G:\\Dropbox\\my papers\\2017 FIE collusion\\collusion_detection_sample_735 program1.txt");
			FileInputStream fis = new FileInputStream(file);
			// read the file as a byte array
			byte[] data = new byte[(int) file.length()];
			fis.read(data);
			fis.close();
			// convert the byte array into a string
			String str;
			str = new String(data, "UTF-8");
			JSONObject obj = new JSONObject(str);
			// get the actors as an Array
			JSONArray actors = obj.getJSONArray("actors");
			int num_vertices = actors.length();
			
			// Add vertex
			for (int i = 0; i < actors.length(); i++)
			{
			    String individual_actor_id = actors.getJSONObject(i).getString("id");
			    g.addVertex(individual_actor_id);
			}
			
			// get the critiques as an Array
			JSONArray critiques = obj.getJSONArray("crituques");
			// Add the edges into a 2-D array
			for (int i = 0; i < critiques.length(); i++)
			{
			    String reviewerActorIdString = critiques.getJSONObject(i).getString("reviewer_actor_id");
			    String revieweeActorIdString = critiques.getJSONObject(i).getString("reviewee_actor_id");
			    double score = critiques.getJSONObject(i).getDouble("score");
			    if(score>99.0 && !revieweeActorIdString.equals(reviewerActorIdString))
			    {
			    	g.addEdge(reviewerActorIdString, revieweeActorIdString);
			    }
			}
	        
	        return g;
		} catch (UnsupportedEncodingException e) {
			// TODO Auto-generated catch block
			System.out.println( "UnsupportedEncodingException!");
			return null;
		} catch (FileNotFoundException e) {
			System.out.println( "FileNotFoundException!");
			return null;
		} catch (IOException e) {
			System.out.println( "FileNotFoundException!");
			return null;
		}
    }
}
