<tr className="border-b border-gray-200">
    <th className="py-2 px-3 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Day</th>
    <th className="py-2 px-3 font-bold text-orange-600 uppercase tracking-wider text-[10px]">Breakfast</th>
    <th className="py-2 px-3 font-bold text-green-600 uppercase tracking-wider text-[10px]">Lunch</th>
    <th className="py-2 px-3 font-bold text-yellow-600 uppercase tracking-wider text-[10px]">Snacks</th>
    <th className="py-2 px-3 font-bold text-blue-600 uppercase tracking-wider text-[10px]">Dinner</th>
</tr>
        </thead >
    <tbody className="divide-y divide-gray-100">
        {days.map(day => (
            <tr key={day} id={`row-${day}`} className="hover:bg-gray-50 transition-colors group duration-300">
                <td className="py-1.5 px-3 font-bold text-gray-800 text-[10px]">{day}</td>
                <td className="py-1.5 px-3 text-gray-600 group-hover:text-gray-900 text-[10px] leading-tight">{mess.menu[day]?.Breakfast}</td>
                <td className="py-1.5 px-3 text-gray-600 group-hover:text-gray-900 text-[10px] leading-tight">{mess.menu[day]?.Lunch}</td>
                <td className="py-1.5 px-3 text-gray-600 group-hover:text-gray-900 text-[10px] leading-tight">{mess.menu[day]?.Snacks}</td>
                <td className="py-1.5 px-3 text-gray-600 group-hover:text-gray-900 text-[10px] leading-tight">{mess.menu[day]?.Dinner}</td>
            </tr>
        ))}
    </tbody>
    </table >
);

export default MessDetail;
