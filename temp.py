# import math

# def reward_function(params):
#     '''
#     Advanced reward function for AWS DeepRacer:
#     - Encourages staying close to the center of the track using 3 markers
#     - Rewards smooth steering, good heading alignment, progress, and speed
#     - Penalizes collisions and lane sharing with obstacles
#     '''

#     # === Retrieve parameters ===
#     all_wheels_on_track = params['all_wheels_on_track']
#     distance_from_center = params['distance_from_center']
#     track_width = params['track_width']
#     objects_distance = params['objects_distance']
#     _, next_object_index = params['closest_objects']
#     objects_left_of_center = params['objects_left_of_center']
#     is_left_of_center = params['is_left_of_center']
#     progress = params['progress']
#     heading = params['heading']
#     waypoints = params['waypoints']
#     closest_waypoints = params['closest_waypoints']
#     steering_angle = abs(params['steering_angle'])

#     # === Initialize reward ===
#     reward = 1e-3  # Minimum reward

#     # === 1. Staying close to center using 3 markers ===
#     marker_1 = 0.1 * track_width  # Excellent
#     marker_2 = 0.25 * track_width # Good
#     marker_3 = 0.5 * track_width  # Acceptable

#     if all_wheels_on_track:
#         if distance_from_center <= marker_1:
#             reward += 1.5  # Perfect centering
#         elif distance_from_center <= marker_2:
#             reward += 1.0  # Good
#         elif distance_from_center <= marker_3:
#             reward += 0.5  # Acceptable
#         else:
#             reward *= 0.1  # Too far from center
#     else:
#         return 1e-3  # Off-track, return minimal reward immediately


#     # === 3. Smooth steering ===
#     if steering_angle > 20:
#         reward *= 0.8  # Penalize sharp steering to encourage smooth driving

#     # === 4. Track direction alignment ===
#     next_wp = waypoints[closest_waypoints[1]]
#     prev_wp = waypoints[closest_waypoints[0]]
#     track_direction = math.degrees(math.atan2(next_wp[1] - prev_wp[1],
#                                               next_wp[0] - prev_wp[0]))
#     direction_diff = abs(track_direction - heading)
#     if direction_diff > 180:
#         direction_diff = 360 - direction_diff

#     if direction_diff > 10:
#         reward *= 0.7  # Penalize if heading too far from track direction

#     # === 6. Object avoidance ===
#     reward_avoid = 1.0
#     distance_closest_object = objects_distance[next_object_index]
#     is_same_lane = objects_left_of_center[next_object_index] == is_left_of_center

#     if is_same_lane:
#         if 0.5 <= distance_closest_object < 0.8: 
#             reward_avoid *= 0.5
#         elif 0.3 <= distance_closest_object < 0.5:
#             reward_avoid *= 0.2
#         elif distance_closest_object < 0.3:
#             reward_avoid = 1e-3  # Likely crashed or too close

#     reward *= reward_avoid  # Apply object avoidance penalty

#     # === Return final reward ===
#     return float(reward)





# import math

# def reward_function(params):
#     '''
#     Optimized reward function for AWS DeepRacer with 1.5 m/s max speed:
#     - Enhanced center-line following with smoother transitions
#     - Balanced speed and steering rewards
#     - Robust object avoidance with lane change rewards
#     - Progress-based incentives with diminishing returns
#     - Stronger efficiency penalties
#     - Turn-specific rewards for sharp corners
#     '''
    
#     # === Read input parameters ===
#     all_wheels_on_track = params['all_wheels_on_track']
#     distance_from_center = params['distance_from_center']
#     track_width = params['track_width']
#     progress = params['progress']
#     speed = params['speed']
#     heading = params['heading']
#     waypoints = params['waypoints']
#     closest_waypoints = params['closest_waypoints']
#     steering_angle = abs(params['steering_angle'])
#     is_left_of_center = params['is_left_of_center']
#     objects_distance = params.get('objects_distance', [])  # Safe access
#     objects_left_of_center = params.get('objects_left_of_center', [])
#     _, next_object_index = params['closest_objects']
#     steps = params['steps']
    
#     # === Initialize reward ===
#     reward = 1.0  # Base reward
    
#     # === 1. Stay on track (critical) ===
#     if not all_wheels_on_track:
#         return 1e-3  # Immediate return for off-track
    
#     # === 2. Center line following ===
#     # Adjusted markers for smoother transitions
#     marker_1 = 0.05 * track_width  # Excellent
#     marker_2 = 0.15 * track_width  # Very good
#     marker_3 = 0.25 * track_width  # Good
#     marker_4 = 0.35 * track_width  # Acceptable
    
#     if distance_from_center <= marker_1:
#         reward *= 2.0  # Increased for perfect centering
#     elif distance_from_center <= marker_2:
#         reward *= 1.5  # Smoother drop-off
#     elif distance_from_center <= marker_3:
#         reward *= 1.0  # Neutral for good positioning
#     elif distance_from_center <= marker_4:
#         reward *= 0.5  # Milder penalty
#     else:
#         reward *= 0.2  # Slightly higher to avoid harsh punishment
    
#     # === 3. Speed optimization ===
#     speed_max = 1.5
#     speed_min = 0.5
    
#     # Apply speed reward more broadly (up to marker_3)
#     if distance_from_center <= marker_3:
#         speed_reward = (speed - speed_min) / (speed_max - speed_min)  # Normalized [0,1]
#         speed_reward = max(0.0, min(speed_reward, 1.0))  # Clamp
#         reward += speed_reward * 0.5  # Slightly increased weight
    
#     # Penalize very low speeds globally
#     if speed < speed_min:
#         reward *= 0.6  # Slightly harsher to encourage movement
    
#     # === 4. Steering and direction alignment ===
#     # Calculate track direction
#     next_point = waypoints[closest_waypoints[1]]
#     prev_point = waypoints[closest_waypoints[0]]
#     track_direction = math.atan2(next_point[1] - prev_point[1], 
#                                 next_point[0] - prev_point[0])
#     track_direction = math.degrees(track_direction)
    
#     direction_diff = abs(track_direction - heading)
#     if direction_diff > 180:
#         direction_diff = 360 - direction_diff
    
#     # Apply steering penalties at all speeds, scaled by speed
#     steering_penalty = 1.0
#     if steering_angle > 20 or direction_diff > 20:
#         steering_penalty = 0.7  # Harsher for significant misalignment
#     elif steering_angle > 15 or direction_diff > 15:
#         steering_penalty = 0.85  # Moderate
#     reward *= steering_penalty * (0.8 + 0.2 * (speed / speed_max))  # Scale by speed
    
#     # === 5. Sharp turn detection and speed adjustment ===
#     # Calculate curvature using three waypoints (prev, current, next)
#     prev_idx = max(0, closest_waypoints[0] - 1)
#     curr_idx = closest_waypoints[0]
#     next_idx = closest_waypoints[1]
    
#     if prev_idx < len(waypoints) and curr_idx < len(waypoints) and next_idx < len(waypoints):
#         p1 = waypoints[prev_idx]
#         p2 = waypoints[curr_idx]
#         p3 = waypoints[next_idx]
        
#         # Vectors between points
#         v1_x = p2[0] - p1[0]
#         v1_y = p2[1] - p1[1]
#         v2_x = p3[0] - p2[0]
#         v2_y = p3[1] - p2[1]
        
#         # Angle between vectors (in degrees)
#         dot_product = v1_x * v2_x + v1_y * v2_y
#         mag1 = math.sqrt(v1_x**2 + v1_y**2)
#         mag2 = math.sqrt(v2_x**2 + v2_y**2)
#         if mag1 > 0 and mag2 > 0:
#             cos_angle = dot_product / (mag1 * mag2)
#             cos_angle = max(-1.0, min(1.0, cos_angle))  # Clamp to avoid math errors
#             turn_angle = math.degrees(math.acos(cos_angle))
            
#             # Sharp turn detection (angle > 30 degrees)
#             if turn_angle > 30:
#                 if speed > 1.0:
#                     reward *= 0.6  # Penalize high speed in sharp turns
#                 elif speed < 0.8:
#                     reward *= 1.2  # Reward slower speeds in sharp turns
    
#     # === 6. Object avoidance with lane change reward ===
#     if objects_distance and next_object_index < len(objects_distance):
#         distance_closest_object = objects_distance[next_object_index]
#         is_same_lane = (next_object_index < len(objects_left_of_center) and 
#                        objects_left_of_center[next_object_index] == is_left_of_center)
        
#         # Increased penalties for close objects
#         if is_same_lane and distance_closest_object < 1.2:
#             if distance_closest_object < 0.4:
#                 reward *= 0.2  # Harsher penalty
#             elif distance_closest_object < 0.8:
#                 reward *= 0.6  # Moderate penalty
#             else:
#                 reward *= 0.8  # Mild penalty for distant objects
        
#         # Reward for successful lane change
#         if is_same_lane and distance_closest_object < 1.2:
#             # Assume lane change if car is on opposite side of object and not too close
#             if (next_object_index < len(objects_left_of_center) and 
#                 objects_left_of_center[next_object_index] != is_left_of_center and 
#                 distance_closest_object > 0.4):
#                 reward += 0.5  # Reward for avoiding object via lane change
    
#     # === 7. Progress and efficiency ===
#     # Use logarithmic progress reward to prevent dominance
#     progress_reward = math.log1p(progress) * 0.5  # Diminishing returns
#     reward += progress_reward
    
#     # Stronger step penalty for efficiency
#     reward *= 0.995 ** steps
    
#     # === 8. Final reward adjustment ===
#     reward = max(1e-3, min(reward, 3.0))  # Tighter upper bound
    
#     return float(reward)



import math

def reward_function(params):
    '''
    Optimized reward function for AWS DeepRacer with 1.5 m/s max speed:
    - Enhanced center-line following with smoother transitions
    - Balanced speed and steering rewards
    - Robust object avoidance with lane change rewards
    - Progress-based incentives with diminishing returns
    - Stronger efficiency penalties
    - Turn-specific rewards for sharp corners
    '''
    
    # === Read input parameters ===
    all_wheels_on_track = params['all_wheels_on_track']
    distance_from_center = params['distance_from_center']
    track_width = params['track_width']
    progress = params['progress']
    speed = params['speed']
    heading = params['heading']
    waypoints = params['waypoints']
    closest_waypoints = params['closest_waypoints']
    steering_angle = abs(params['steering_angle'])
    is_left_of_center = params['is_left_of_center']
    objects_distance = params.get('objects_distance', [])  # Safe access
    objects_left_of_center = params.get('objects_left_of_center', [])
    _, next_object_index = params['closest_objects']
    steps = params['steps']
    
    # === Initialize reward ===
    reward = 1.0  # Base reward
    
    # === 1. Stay on track (critical) ===
    if not all_wheels_on_track:
        return 1e-3  # Immediate return for off-track
    
    # === 2. Center line following ===
    # Adjusted markers for smoother transitions
    marker_1 = 0.05 * track_width  # Excellent
    marker_2 = 0.15 * track_width  # Very good
    marker_3 = 0.25 * track_width  # Good
    marker_4 = 0.35 * track_width  # Acceptable
    
    if distance_from_center <= marker_1:
        reward *= 2.0  # Increased for perfect centering
    elif distance_from_center <= marker_2:
        reward *= 1.5  # Smoother drop-off
    elif distance_from_center <= marker_3:
        reward *= 1.0  # Neutral for good positioning
    elif distance_from_center <= marker_4:
        reward *= 0.5  # Milder penalty
    else:
        reward *= 0.2  # Slightly higher to avoid harsh punishment
    
    # === 3. Speed optimization ===
    speed_max = 1.5
    speed_min = 0.5
    
    # Apply speed reward more broadly (up to marker_3)
    if distance_from_center <= marker_3:
        speed_reward = (speed - speed_min) / (speed_max - speed_min)  # Normalized [0,1]
        speed_reward = max(0.0, min(speed_reward, 1.0))  # Clamp
        reward += speed_reward * 0.5  # Slightly increased weight
    
    # Penalize very low speeds globally
    if speed < speed_min:
        reward *= 0.6  # Slightly harsher to encourage movement
    
    # === 4. Steering and direction alignment ===
    # Calculate track direction
    next_point = waypoints[closest_waypoints[1]]
    prev_point = waypoints[closest_waypoints[0]]
    track_direction = math.atan2(next_point[1] - prev_point[1], 
                                next_point[0] - prev_point[0])
    track_direction = math.degrees(track_direction)
    
    direction_diff = abs(track_direction - heading)
    if direction_diff > 180:
        direction_diff = 360 - direction_diff
    
    # Apply steering penalties at all speeds, scaled by speed
    steering_penalty = 1.0
    if steering_angle > 20 or direction_diff > 20:
        steering_penalty = 0.7  # Harsher for significant misalignment
    elif steering_angle > 15 or direction_diff > 15:
        steering_penalty = 0.85  # Moderate
    reward *= steering_penalty * (0.8 + 0.2 * (speed / speed_max))  # Scale by speed
    
    # === 5. Sharp turn detection and speed adjustment ===
    # Calculate curvature using three waypoints (prev, current, next)
    prev_idx = max(0, closest_waypoints[0] - 1)
    curr_idx = closest_waypoints[0]
    next_idx = closest_waypoints[1]
    
    if prev_idx < len(waypoints) and curr_idx < len(waypoints) and next_idx < len(waypoints):
        p1 = waypoints[prev_idx]
        p2 = waypoints[curr_idx]
        p3 = waypoints[next_idx]
        
        # Vectors between points
        v1_x = p2[0] - p1[0]
        v1_y = p2[1] - p1[1]
        v2_x = p3[0] - p2[0]
        v2_y = p3[1] - p2[1]
        
        # Angle between vectors (in degrees)
        dot_product = v1_x * v2_x + v1_y * v2_y
        mag1 = math.sqrt(v1_x**2 + v1_y**2)
        mag2 = math.sqrt(v2_x**2 + v2_y**2)
        if mag1 > 0 and mag2 > 0:
            cos_angle = dot_product / (mag1 * mag2)
            cos_angle = max(-1.0, min(1.0, cos_angle))  # Clamp to avoid math errors
            turn_angle = math.degrees(math.acos(cos_angle))
            
            # Sharp turn detection (angle > 30 degrees)
            if turn_angle > 30:
                if speed > 1.0:
                    reward *= 0.6  # Penalize high speed in sharp turns
                elif speed < 0.8:
                    reward *= 1.2  # Reward slower speeds in sharp turns
    
    # === 6. Object avoidance with lane change penalty ===
    if objects_distance and next_object_index < len(objects_distance):
        reward_avoid = 1.0
        distance_closest_object = objects_distance[next_object_index]
        is_same_lane = (next_object_index < len(objects_left_of_center) and 
                        objects_left_of_center[next_object_index] == is_left_of_center)

        if is_same_lane:
            if 0.7 <= distance_closest_object < 1.0: 
                reward_avoid *= 0.7  # Mild penalty
            elif 0.4 <= distance_closest_object < 0.7:
                reward_avoid *= 0.4  # Moderate penalty
            elif distance_closest_object < 0.4:
                reward_avoid = 1e-3  # Critical - likely crash or too close

        reward *= reward_avoid  # Apply object avoidance penalty
    
    # === 7. Progress and efficiency ===
    # Use logarithmic progress reward to prevent dominance
    progress_reward = math.log1p(progress) * 0.5  # Diminishing returns
    reward += progress_reward
    
    # Stronger step penalty for efficiency
    reward *= 0.995 ** steps
    
    # === 8. Final reward adjustment ===
    reward = max(1e-3, min(reward, 3.0))  # Tighter upper bound
    
    return float(reward)
