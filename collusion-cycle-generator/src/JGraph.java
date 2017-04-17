import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.jgrapht.*;
import org.jgrapht.alg.cycle.JohnsonSimpleCycles;
import org.jgrapht.graph.*;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import com.fasterxml.jackson.databind.ObjectMapper;


public class JGraph {
	
	// constant definition
	public static final int CIRCLE_SIZE = 4; // ��
	public static final double PERCENTAGE_ADJUSTMENT = 0.05; //��1, ��2
	
	
    private JGraph()
    {
    } // ensure non-instantiability.

    public static void main(String[] args)
    {
    	String dirName = "EZ-pervasive";
    	File dir = new File(dirName);
    	File[] files = dir.listFiles();
    	String[] pervasiveData = new String[]{" "};
    	for(int i = 0; i < files.length; i++){
    		if(files[i].isFile()){
    			String filePath = ".\\" + dirName + "\\" + files[i].getName();
    			System.out.println("=====" + Integer.toString(i) + ": " + filePath + "====================");
    	    	// note undirected edges are printed as: {<v1>,<v2>}
    	        // note directed edges are printed as: (<v1>,<v2>)
    			Map<String, Map<String, Double>> reviewMatirx = new HashMap<String, Map<String, Double>>();
    	        DirectedGraph<String, DefaultEdge> directedGraph = createStringGraph(reviewMatirx, pervasiveData, files[i].getName(), filePath);
    	        System.out.println(directedGraph.toString());
    	        // create a graph based on URL objects
    	        // DirectedGraph<URL, DefaultEdge> hrefGraph = createHrefGraph();
    	        // System.out.println(hrefGraph.toString());
    	        /**
    	         * Colluion condition 1: cycle
    	         */
//    	        JohnsonSimpleCycles<String, DefaultEdge> cyclesFinder = new JohnsonSimpleCycles<String, DefaultEdge>(directedGraph) ;
//    	        List<List<String>> cycles = cyclesFinder.findSimpleCycles();
//    	        UpdateJSONFiles(reviewMatirx, cycles, dirName, filePath);
    	        
    		}
    	}
    	writeEZPervasiveData(pervasiveData);
    }
    
    /**
     * Creates a toy directed graph based on URL objects that represents link structure.
     *
     * @return a graph based on URL objects.
     */
    private static DirectedGraph<URL, DefaultEdge> createHrefGraph()
    {
        DirectedGraph<URL, DefaultEdge> g = new DefaultDirectedGraph<URL, DefaultEdge>(DefaultEdge.class);

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
        DirectedGraph<String, DefaultEdge> g = new DefaultDirectedGraph<String, DefaultEdge>(DefaultEdge.class);
        
        String v1 = "v1";
        String v2 = "v2";
        String v3 = "v3";
        String v4 = "v4";

        // add the vertices
        g.addVertex(v1);
        g.addVertex(v2);
        g.addVertex(v3);
        g.addVertex(v4);

        // add edges to create a circuit
        g.addEdge(v1, v2);
        g.addEdge(v2, v3);
        g.addEdge(v3, v4);
        g.addEdge(v4, v1);
        g.addEdge(v1, v1); //a cycle from a vertex back to it self
        g.addEdge(v2, v1); //a cycle of two vertices
        return g;
    }

    /**
     * @param file paths of json files generated by https://github.com/peerlogic/Data-Warehouse-Object-Relational-Mapping
     * @param the score threshold to decide the line (edge) color in d3 visualization. 
     * If the score is bigger than or equal to the threshold, the corresponding line (edge) will be green
     * and it will be consider during collusion detection. 
     * Otherwisem the line (edge) color will be red, and will be excluded during collusion detection.
     *
     * @return a graph based on String objects.
     */
    private static DirectedGraph<String, DefaultEdge> createStringGraph(Map<String, Map<String, Double>> reviewMatirx, 
    																	String[] pervasiveData,
    																	String taskId,
    																	String filePath)
    {
    	DirectedGraph<String, DefaultEdge> g = new DefaultDirectedGraph<String, DefaultEdge>(DefaultEdge.class);
        JSONParser parser = new JSONParser();
    	try {
			Object fileContent =  parser.parse(new FileReader(filePath));
			JSONObject obj = (JSONObject) fileContent;
			double scoreThreshold = (double) obj.get("80 quantile score");
			// get the critiques as an Array
			JSONArray critiques = (JSONArray) obj.get("critiques");
			for (int i = 0; i < critiques.size(); i++)
			{
			    String reviewerActorId = (String)((JSONObject) critiques.get(i)).get("reviewer_actor_id");
			    String revieweeActorId = (String)((JSONObject) critiques.get(i)).get("reviewee_actor_id");
			    // Add vertex
			    if(!g.containsVertex(reviewerActorId)) g.addVertex(reviewerActorId);
			    if(!g.containsVertex(revieweeActorId)) g.addVertex(revieweeActorId);
			    double score = (double)((JSONObject) critiques.get(i)).get("score");   
			    GenerateReviewMatrix(reviewMatirx, reviewerActorId, revieweeActorId, score);
			    /**
			     * Colluion condition 2: All grades in cycle >= 80 quantile score
			     */
			    if(score >= scoreThreshold && reviewerActorId.compareTo(revieweeActorId) != 0 )
			    {
			    	g.addEdge(reviewerActorId, revieweeActorId);
			    }
			}
			calcPervasive(reviewMatirx, pervasiveData, taskId, scoreThreshold);
	        return g;
		} catch (UnsupportedEncodingException e) {
			System.out.println( "UnsupportedEncodingException!");
			return null;
		} catch (FileNotFoundException e) {
			System.out.println( "FileNotFoundException!");
			return null;
		} catch (IOException e) {
			System.out.println( "FileNotFoundException!");
			return null;
		} catch (ParseException e) {
			e.printStackTrace();
			return null;
		}
    }
    
    /**
     * reference: http://crunchify.com/how-to-write-json-object-to-file-in-java/
     * reference: https://www.mkyong.com/java/json-simple-example-read-and-write-json/
     * @param cycles
     * @param filePath
     */
    private static void UpdateJSONFiles(Map<String, Map<String, Double>> reviewMatirx, 
    									List<List<String>> cycles, 
    									String dirName,
    									String filePath){
    	JSONParser parser = new JSONParser();
    	JSONObject obj = null;
    	try {
    		// read file
    		Object fileContent =  parser.parse(new FileReader(filePath));
			obj = (JSONObject) fileContent;
			double sumScore = (double) obj.get("sum_score_in_whole_task");
			// generate collude_cycles info
	    	List<String> colluderList = new ArrayList<String>();
	    	JSONArray colluders = new JSONArray();
	    	JSONArray colluderCycles = new JSONArray();
	    	for (int i = 0; i < cycles.size(); i++){
	        	List<String> currentCycle = cycles.get(i);
	        	/**
	        	 * Colluion condition 3: Circle size <= �� 
	        	 */
	        	if (currentCycle.size() > CIRCLE_SIZE) continue;
	        	colluders = new JSONArray();
	        	for (int j = 0; j < currentCycle.size(); j++){
	        		colluderList.add(currentCycle.get(j));
	        		System.out.print(currentCycle.get(j) + " ");
	        		colluders.add(currentCycle.get(j));
	        	}
	        	System.out.println();
	        	/**
	        	 * Colluion condition 4: avg(review scores in cycle)/avg(review scores out cycle) >= 1 + ��1
	        	 */
	        	double sumScoreInCycle = 0.0;
	        	for(int m = 0; m < colluderList.size(); m++){
	        		Map<String, Double> tempMap = reviewMatirx.get(colluderList.get(m));
	        		for(int n = 0; n < colluderList.size(); n++){
	        			if(tempMap.containsKey(colluderList.get(n))){
	        				sumScoreInCycle += tempMap.get(colluderList.get(n));
	        			}
	        		}
	        	}
	        	boolean isCollude = false;
	        	if(sumScoreInCycle / (sumScore - sumScoreInCycle) >= 1 + PERCENTAGE_ADJUSTMENT) isCollude = true;
	        	if(isCollude && colluders.size() > 0) {
	        		colluderCycles.add(colluders);
	        	}
	        }
	    	// append collude_cycles info
			obj.put("colluder_cycles", colluderCycles);
		} catch (UnsupportedEncodingException e) {
			System.out.println( "UnsupportedEncodingException!");
			return;
		} catch (FileNotFoundException e) {
			System.out.println( "FileNotFoundException!");
			return;
		} catch (IOException e) {
			System.out.println( "FileNotFoundException!");
			return;
		} catch (ParseException e) {
			e.printStackTrace();
		}
    	// write to json file
    	try (FileWriter file = new FileWriter(filePath.replaceAll(dirName, dirName + "-with-collusion-cycle"))) {
    		// beautify json
    		ObjectMapper mapper = new ObjectMapper();
    		Object json = mapper.readValue(obj.toString(), Object.class);
			file.write(mapper.writerWithDefaultPrettyPrinter().writeValueAsString(json));
			System.out.println("Successfully Copied JSON Object to File...");
    	} catch (UnsupportedEncodingException e) {
			System.out.println( "UnsupportedEncodingException!");
			return;
		} catch (FileNotFoundException e) {
			System.out.println( "FileNotFoundException!");
			return;
		} catch (IOException e) {
			System.out.println( "FileNotFoundException!");
			return;
		}
    }
    
    /**
     * Generate review matrix in order to calculate average and inflation rate.
     * @param reviewMatrix
     * @param reviewer
     * @param reviewee
     * @param score
     */
    private static void GenerateReviewMatrix(Map<String, Map<String, Double>> reviewMatrix, String reviewer, String reviewee, double score){
    	Map<String, Double> temp;
    	if(!reviewMatrix.containsKey(reviewer))
    		temp = new HashMap<String, Double>();
    	else
    		temp = reviewMatrix.get(reviewer);
    	temp.put(reviewee, score);
		reviewMatrix.put(reviewer, temp);
    }

    /**
     * Populate pervasive data
     * @param reviewMatirx
     * @param pervasiveData
     * @param taskId
     * @param scoreThreshold
     */
    private static void calcPervasive(Map<String, Map<String, Double>> reviewMatirx, 
    								  String[] pervasiveData,
    								  String taskId,
    								  double scoreThreshold){
    	pervasiveData[0] += (taskId + "\t");
    	int reviewCount = 0;
    	int pervasiveColluder = 0;
    	int totalNumofPervasiveReviews = 0;
    	for(String reviewer : reviewMatirx.keySet()){
    		reviewCount += reviewMatirx.get(reviewer).size();
    	}
    	double avgReviewCount = reviewCount / reviewMatirx.size();
    	for(String reviewer : reviewMatirx.keySet()){
    		int numOfScoreBiggerThanThreshold = 0;
    		/**
    		 * Pervasive condition 1: # of reviews for certain reviewer >= avg # of reviews 
    		 */
    		if(reviewMatirx.get(reviewer).size() >= avgReviewCount){
    			for(String reviewee: reviewMatirx.get(reviewer).keySet()){
    				if(reviewMatirx.get(reviewer).get(reviewee) >= scoreThreshold) numOfScoreBiggerThanThreshold++;
    			}
    		}
    		/**
    		 * Pervasive condition 2: (review score >= 80 quantile score)/total review done >= 1 - ��2
    		 */
    		if(numOfScoreBiggerThanThreshold * 1.0 / reviewMatirx.get(reviewer).size() >= 1 - PERCENTAGE_ADJUSTMENT){
    			pervasiveColluder++;
    			totalNumofPervasiveReviews += numOfScoreBiggerThanThreshold;
    		}
    	}
    	pervasiveData[0] += (Integer.toString(pervasiveColluder) + "\t");
    	pervasiveData[0] += (Double.toString(totalNumofPervasiveReviews * 1.0 / reviewCount) + "\t");
    	pervasiveData[0] += "\n ";
    }
    
    /**
     * 
     * @param pervasiveData
     */
    private static void writeEZPervasiveData(String[] pervasiveData){
    	// write to json file
    	try (FileWriter file = new FileWriter(".\\EZ-data-warehouse-output-with-pervasive-data")) {
    		// beautify json
			file.write(pervasiveData[0]);
			System.out.println("Successfully Write Pervaisve Info to File...");
    	} catch (UnsupportedEncodingException e) {
			System.out.println( "UnsupportedEncodingException!");
			return;
		} catch (FileNotFoundException e) {
			System.out.println( "FileNotFoundException!");
			return;
		} catch (IOException e) {
			System.out.println( "FileNotFoundException!");
			return;
		}
    }
}
